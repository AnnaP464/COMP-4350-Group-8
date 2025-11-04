# HiveHand

HiveHand is a platform for hosting and finding volunteering oppertunities. Volunteers will see a selection of events they can choose to lend a helping hand at. Organizers will recieve lots of customization options for their events to attract just the right people. The experience will be gameafied to make it more exciting by tracking hours volunteered and keeping score.


## Acknowledgements

 - Anna Pavlova
 - Noah McInnes
 - Sudipta Sarker

## Setting up the Project
Our project is built to run on Windows and Apple OS. 
To run our project you will need a few downloads
1) Node.js + npm which powers our React typescript environment [download here](https://nodejs.org)
2) PostgreSQL for the database, when setting up the database be sure to set a password you can easily recall[download here](https://www.postgresql.org/download/windows/)
3) Git to run the setup script, optional if you are ok with manually running the setup commands [download here](https://git-scm.com/downloads/win)

## Getting Docker Images Setup

Setting up Containers, in root:
```
docker compose up
```
will take a long while but only the first time after making changes to the code, make sure to re build the front end or api depending on where the change is coming from.

Upon cloning the repo you just need to go into the root and run the ./setup.sh script in bash, alternatively run each command in the order it is shown to set up the api, front-end and the postgreSQL database.

To run the project you need to run the npm run dev command in the api and the front-end folders resepctively and then go to [http://localhost:5173/](http://localhost:5173/)

---
## [Sprint 0](https://github.com/AnnaP464/COMP-4350-Group-8/blob/main/Sprint%200/sprint0.md)

## [Sprint 1](https://github.com/AnnaP464/COMP-4350-Group-8/blob/main/Sprint%201/sprint1.md)
## Tech Stack

##### Front End 
React - Our team has previous experience with React and similar technology (Angular), and it’s ideal for building interactive UIs quickly.
##### Back End
Node.js
- Same language (TypeScript/JavaScript) on both sides reduces context switching and speeds up development. Great for I/O-heavy apps (lots of short API calls, DB reads/writes).

Express.js
- Lightweight and unopinionated, so we can ship quickly: define REST endpoints, and keep clear “routes -> logic ->  DB” structure.
##### Database
PostgreSQL 
- We anticipate rich relationships in our data (volunteers -> shifts -> events -> organizers). We get constraints (e.g., capacity limits), transactions (no race conditions), and powerful queries for search/reporting.

PostGIS 
- Native geospatial support for “near me,” distance/radius queries, and map pins that update as events are created.
##### Blockchain
Base (Ethereum L2, OP Stack) 
- supports gamification (verifiable badges/levels tied to anchored records) and trust (organizers/volunteers can confirm history hasn’t been altered).
- built in trust can be attractive to sponsors and allow rewards to be available to a larger number of people regardless of location and independent of any organization
- can keep PII in database 

