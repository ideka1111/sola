# backend/main_graph.py
from typing import TypedDict

from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END

from router import route_user_text
from general_graph import general_graph
from emergency_graph import graph as emergency_graph

from typing import TypedDict, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class RouterState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


def route_and_run(state: RouterState) -> RouterState:
    msgs = state.get("messages", [])

    last_human = next(
        (m for m in reversed(msgs) if isinstance(m, HumanMessage)),
        None
    )
    text = last_human.content if last_human else ""

    decision = route_user_text(text)

    print(
        f"[ROUTER] route={decision['route']} "
        f"conf={float(decision['confidence']):.2f} "
        f"via={decision['via']} "
        f"reason={decision['reason']}"
    )

    if decision["route"] == "emergency":
        out = emergency_graph.invoke({"messages": [HumanMessage(content=text)]})
    else:
        out = general_graph.invoke({"messages": [HumanMessage(content=text)]})

    out_msgs = out["messages"]
    last_ai = next(
        (m for m in reversed(out_msgs) if isinstance(m, AIMessage)),
        None
    )

    router_meta = (
        f"[router: {decision['route']} "
        f"conf={float(decision['confidence']):.2f} "
        f"via={decision['via']}] {decision['reason']}\n\n"
    )

    return {
        "messages": msgs + [AIMessage(content=router_meta + (last_ai.content if last_ai else ""))]
    }


g = StateGraph(RouterState)
g.add_node("route", route_and_run)
g.add_edge(START, "route")
g.add_edge("route", END)

graph = g.compile()
