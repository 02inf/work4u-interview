# AI Meeting Digest

## How to run this project

To run this project, you need to install docker in advance.

Before you start this application, please contact me through email to get DeepSeek API key. Paste the key in the file `.env`
```bash
AGENT_MODEL_API_KEY="Paste API key here"
```

Then run this command in the root directory of the project:

```bash
docker compose up -d
```

## How to use

You can only access the application through your web browser on the same machine where the Docker container is running.

1. Open your web browser and go to `http://localhost:5173/digest`.
2. You should see the page with an editable text area, paste your meeting notes here.
