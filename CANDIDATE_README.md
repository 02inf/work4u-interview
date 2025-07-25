1. Technology Choices
Frontend: Vite + React + TailwindCSS
Backend: Node.js + NestJS + Express
Database: Postgresql
AI Service: vercel ai sdk + qwen

for frontend I just want a pure React framework, not a full SSR or SSG framework, since create-react-app has been deprecated, so I choose vite as dev server and project template.

for backend I want use same program languae, and a modern framework, NestJS is the best choice. It looks like Spring Boot, has so many built-in technical.

for AI Service, vercel ai sdk provide friendly integration of llm call, with some advanced usage like structured outpu, tooling, it also support.

2. How to Run the Project
```
cd frontend && pnpm install && npm run dev
cd backend && pnpm install && npx prisma migrate dev && npm run start
```

3. Design Decisions & Trade-offs
for share link, I just create a share uuid in conversation entity. If I can do more, I will manage share link independently, to support expire time, permission on it, also in frontend will display a different view for share link page.

4. AI Usage Log
```
 I have a frontend project, the user story is allows a user to submit a raw meeting transcript and, in return, receive a concise, AI-generated summary. the tech stack is vite, react, tailwindcss, typescript. I already installed all dependency for project, you only need implement frontend functions. the requirements is: 1. leftside is create button for conversation and a list of conversations. 2. middle area is  main area, above is message from user and system, bottom is input area. 3. rightside is setting area. I want the style is bright and simple and technical. now frontend layout is finished, in MainContent.tsx, you need display user input and api response in the above

 I implement /conversation/list api in backend, now in frontend leftside need display all conversation by call this api

 based on backend dir's ai.service.ts file, I define a zod structure, please modify MainContent.tsx, to display this structure correctly, with a summary line, a list of decisions and a list of action with   its assignee

 here has another feature: Allow a user to share a generated digest with others via a unique, permanent URL. so for frontend, you need implement a new page/route for the url like /digest/:uuid, don't need install any dependency

 add a share button on MainContent.tsx, to create a share link for it, after click create share link button, call backend api(in conversation controller) then copy the link into clipboard

 the share button's position is wrong, it need a toolbar on the top of main area, then share button is on the right of toolbar
```