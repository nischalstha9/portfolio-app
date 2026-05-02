My information Reference file: Resume-Nischal-Shrestha-AU.pdf

# TODO:

## Goal:

- [] To build resume server

## Needs:

- [] Multi-user supported
- [] users can edit resume contents
- [] users can get api-key to read content to use in their custom frontend (make it secure and readonly)
- [] User Panel built in Next JS where the users can edit their resume content
- [] User can upload media to object storage (presigned url secure)
- [] A function that can parse the resume and auto fill contents
- [] Users can create different sections as Education, experience, skills etc and upload their own text content or media content.
- [] Admin Panel built in Next JS where the admin can manage users and overall system
- [] basic frontend displayable in custom domain (this can be later used as cname in case user wants to deploy on their own domain)

# Stack to use:

- [] FastAPI
- [] Docker and DockerCompose (make it compatible for both development and production. Use best security policies)
- [] SQL Alchemy or anything best for migration
- [] PostgreSQL
- [] NextJS for frontend
- [] use separate dir for frontend and backend.
- [] you can use any docker containers required (ex: postgres, nginx, object storage etc.)

# Test

- [] Use resume-nischal-shrestha-au.pdf to fill in my details for a sample user.
