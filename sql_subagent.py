import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from sqlalchemy.engine import URL
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit

from langgraph.graph import START, END, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode
from langchain.messages import AIMessage

load_dotenv(override=True)

sub_llm = ChatOpenAI(
    api_key=os.getenv("OPENAI_KEY"),
    model="gpt-5",
    temperature=0.1,
    disabled_params={"stop": None},
)

db_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "postgres"),
)
db = SQLDatabase.from_uri(db_url.render_as_string(hide_password=False))

toolkit = SQLDatabaseToolkit(db=db, llm=sub_llm)
tools = toolkit.get_tools()

list_tables_tool = next(t for t in tools if t.name == "sql_db_list_tables")
get_schema_tool = next(t for t in tools if t.name == "sql_db_schema")
run_query_tool = next(t for t in tools if t.name == "sql_db_query")

get_schema_node = ToolNode([get_schema_tool], name="get_schema")
run_query_node = ToolNode([run_query_tool], name="run_query")

GENERATE_QUERY_SYSTEM_PROMPT = f"""
You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {db.dialect} query to run,
then look at the results of the query and return the answer. Always limit to 5 rows.
Never do DML (INSERT/UPDATE/DELETE/DROP).
""".strip()

CHECK_QUERY_SYSTEM_PROMPT = f"""
You are a SQL expert with a strong attention to detail.
Double check the {db.dialect} query for common mistakes, including:
- Using NOT IN with NULL values
- Using UNION when UNION ALL should have been used
- Using BETWEEN for exclusive ranges
- Data type mismatch in predicates
- Properly quoting identifiers
- Using the correct number of arguments for functions
- Casting to the correct data type
- Using the proper columns for joins

If there are any mistakes, rewrite the query. If there are no mistakes,
just reproduce the original query.

You will call the appropriate tool to execute the query after running this check.
""".strip()

def list_tables(state: MessagesState):
    tool_msg = list_tables_tool.invoke({})
    return {"messages": [AIMessage(content=f"Available tables: {tool_msg}")]}

def call_get_schema(state: MessagesState):
    llm_with_tools = sub_llm.bind_tools([get_schema_tool], tool_choice="any")
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def generate_query(state: MessagesState):
    system_message = {"role": "system", "content": GENERATE_QUERY_SYSTEM_PROMPT}
    llm_with_tools = sub_llm.bind_tools([run_query_tool])
    response = llm_with_tools.invoke([system_message] + state["messages"])
    return {"messages": [response]}

def check_query(state: MessagesState):
    tool_call = state["messages"][-1].tool_calls[0]
    system_message = {"role": "system", "content": CHECK_QUERY_SYSTEM_PROMPT}
    user_message = {"role": "user", "content": tool_call["args"]["query"]}

    llm_with_tools = sub_llm.bind_tools([run_query_tool], tool_choice="any")
    response = llm_with_tools.invoke([system_message, user_message])
    response.id = state["messages"][-1].id
    return {"messages": [response]}

def should_continue(state: MessagesState):
    last = state["messages"][-1]
    return END if not getattr(last, "tool_calls", None) else "check_query"

builder = StateGraph(MessagesState)
builder.add_node("list_tables", list_tables)
builder.add_node("call_get_schema", call_get_schema)
builder.add_node("get_schema", get_schema_node)
builder.add_node("generate_query", generate_query)
builder.add_node("check_query", check_query)
builder.add_node("run_query", run_query_node)

builder.add_edge(START, "list_tables")
builder.add_edge("list_tables", "call_get_schema")
builder.add_edge("call_get_schema", "get_schema")
builder.add_edge("get_schema", "generate_query")
builder.add_conditional_edges("generate_query", should_continue)
builder.add_edge("check_query", "run_query")
builder.add_edge("run_query", "generate_query")

spezialzentrum_agent = builder.compile()
