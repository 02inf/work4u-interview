---
applyTo: "banckend/**/*.py"
---

# Project Overview

This project is to build a full-stack web application that allows a user to submit a raw meeting transcript and, in return, receive a concise, AI-generated summary.

Backend: An API service that:

- Accepts the transcript text from the frontend.
- Sends the transcript to a 3rd-party AI service (like Google's Gemini API) with a carefully crafted prompt to request the summary in the desired format.
- Parses the AI's response.
- Saves both the original transcript and the structured summary to a database.
- Provides an endpoint to retrieve a list of all past digests.

## Folder Structure

- `/src`: Contains the source code for the backend.
- `/docs`: Contains documentation for the project, including API specifications and user guides.

## Libraries and Frameworks

- Python for backend

## Coding Standards

## UI guidelines
