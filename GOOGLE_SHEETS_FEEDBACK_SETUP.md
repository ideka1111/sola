# Feedback -> Google Sheets Setup

## 1) Google Sheet vorbereiten

1. Erstelle ein neues Google Sheet.
2. Benenne das erste Tab z. B. `Feedback`.
3. Lege diese Header in Zeile 1 an:

`created_at_utc | session_id | user_agent | vote | comment | message_id | question | answer | page | client_timestamp`

## 2) Apps Script Webhook erstellen

1. Im Sheet: `Erweiterungen -> Apps Script`.
2. Ersetze den Inhalt mit:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Feedback");
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Sheet 'Feedback' not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents || "{}");
    sheet.appendRow([
      data.created_at_utc || "",
      data.session_id || "",
      data.user_agent || "",
      data.vote || "",
      data.comment || "",
      data.message_id || "",
      data.question || "",
      data.answer || "",
      data.page || "",
      data.client_timestamp || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. `Bereitstellen -> Neue Bereitstellung`.
4. Typ: `Web-App`.
5. Ausführen als: `Ich`.
6. Zugriff: `Jeder mit dem Link`.
7. Deploy und die Web-App-URL kopieren.

## 3) Backend konfigurieren

In deiner `.env` (Backend):

```env
GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/....../exec
GOOGLE_SHEETS_FEEDBACK_TIMEOUT_SEC=10
FEEDBACK_LOCAL_PATH=feedback_events.jsonl
```

## 4) Verhalten im Backend

- Jede Bewertung wird immer lokal in `feedback_events.jsonl` gespeichert.
- Wenn `GOOGLE_SHEETS_FEEDBACK_WEBHOOK_URL` gesetzt ist, wird zusaetzlich zu Google Sheets synchronisiert.
- Falls Google Sheets nicht erreichbar ist, bleibt der Datensatz lokal erhalten.
