# Sprint 0 Worksheet

## HiveHand [GitHub](https://github.com/AnnaP464/COMP-4350-Group-8)

## [Presentation Slides](https://docs.google.com/presentation/d/1q339stCL1ECQrOGEpG8imXiD9Uz1BBI-26ulNVp7nAc/edit?usp=sharing)

## Architecture

```mermaid
flowchart LR
  user([User / Browser])

  subgraph FE ["Frontend (React)"]
    direction TB
    app([UI])
  end

style FE fill:#ffca99,stroke:#333,stroke-width:2px,color:#0

  subgraph BE ["Backend (Node.js + Express)"]
    direction TB
    api([API Routes])
    logic([Application Logic])
  end

style BE fill:#ffca99,stroke:#333,stroke-width:2px,color:#0


  subgraph db ["Database"]
    data([PostgreSQL + PostGIS])
  end
  subgraph l2 ["Smart Contract"]
    block([L2 Chain - Base<br/>Smart Contract])
  end

  %% Connections
  user --> app
  app -->|REST API CALL| api
  api --> logic
  logic --> |Database request SQL|db
  db --> |Query Response|logic
  logic -->|JSON-RPC API Call| l2
  l2 --> |JSON| logic

 %% Styling
  classDef bigLabel font-size:16px,font-weight:bold,fill:#f9f9f9,stroke:#333,stroke-width:2px;
  class BE bigLabel
  class FE bigLabel
```

## [Project Summary](https://github.com/AnnaP464/COMP-4350-Group-8/blob/main/Sprint%200/Project%20Summary.md)
