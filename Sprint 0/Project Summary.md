

# HiveHand
#### Helping hands in a hive

### Project Summary

HiveHand will allow people looking to volunteer to find opportunities to help out within the community. HiveHand will assist both the organizers and volunteers by easing the selection process for volunteer jobs and aims to gameify the process of volunteering to make it more appealing. 

The goal of HiveHand is to help connect people within the community and create a networking environment for volunteering. Currently if you want to volunteer for any given reason you need to seek out a specific organization or a specific activity. This is usually done on an organizations own website, making for a rather variable experience and slowing down the process for both volunteers and organizers, and ultimately limiting the amount of people participating.

HiveHand will be a hub that will allow a large number of both volunteers and activity postings to circulate, and help people with tracking those activities in an efficent interface focused on clarity and ease of use.

### Core Features & Acceptance Criteria

1) Have a profile available for all users, both volunteers and organizers will have profiles that have a small description of the type of work offered for organizers, upcomming events, contact information and a history of past jobs done for volunteers.

- A running total of all the activities will be viewable within seconds of and all the information from previous jobs will be available in case the user wants to work with an organizer again.
- Volunteers, organizers, and sponsors can view verified proofs of past activity, ensuring trustworthiness when deciding to collaborate again.

2) Organizers should be able to create a volunteer listing with a description of the job, location, time, and an upper bound for the amount of help needed. These listings would become visible to potential volunteers and pop up if searched for or in a queue of upcoming events. A volunteer will be able to sign up if there are slots available as well as recind their application if a scheduling error comes up. 
- For a reliable searching experience we expect the result to load within a few seconds to maintain a smooth browsing experince, and an updated list of tasks. Aswell as making sure to provide visibility to organizers quickly.

3) A map to display tasks within the local area. A widget or a page to display pins to help volunteers choose their tasks based on ease of access and let organizers clarify where they are holding the event.
- a working updated map you can view. It is updated as tasks are created.

4)  Volunteers earn points, badges, or levels based on their completed activities, hours contributed, or streaks of consistent involvement Leaderboards and progress trackers provide a fun sense of competition and achievement, making volunteering feel interactive and rewarding.

- Organizers can give badges/prizes to top contributors, encouraging continued participation and making it more attractive for new users to get involved.

5) We hope to scale the application to be able to handle a high throughput of traffic and be able to handle spikes in activity without degrading service significantly.
- A goal for our final itteration will be 100 users and 1000 concurrent requests per minute

### Additional Features

1) Geofenced listings, where organizations specify the event area upon creation which then requires volunteers to be within the specified area to log hours.
- Users can only "sign in" to events when within the events area and only time spent within that area will be logged


### User Stories

1) As a volunteer I want to search through the available postings to see if they line up with my schedule, this would help me make sure that i can adapt my schedule. 

2) As an organizer I want to see the status of the activity at a glance so that i will know how many people will show up, this will aid in planning for additional help if necessary.

3) As a volunteer I want to be able to see my history of attended postings, this would help me keep track of my hours volunteered.

### Tech Stack

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
##### Testing Formatting/Unit/Integration Tests
Formatting - Github Triggers/Hooks - The project is already hosted on github, it makes sense to take advantage of the triggers and hooks to help automate the formatting, testing and building.

Integration & Unit Testing - Jest - An all in one framework for javascript testing, that will take care of most of our needs without a need for other programs.

### Work Coordination
Our group has settled on using discord to maintain a common idea of the project as well as call when we want to discuss a potential change of plans or upcoming deadline. Google Docs works well when it comes to more informal documents that are not submission-critical. 

We have so far allocated work based on personal interest, and personal experience. Making sure to clear up who is assigned what during inperson or online meetings. When we begin implementing the application, assigning github issues will be a potential way for us to keep track of which feature resides with each of us.
