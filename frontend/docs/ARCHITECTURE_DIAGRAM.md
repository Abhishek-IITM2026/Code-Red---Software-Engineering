# Frontend Architecture Diagram (Mermaid.js)

This document contains UML 2.0 compliant diagrams generated using Mermaid.js syntax.

## 1. Package Diagram - High-Level Structure

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4F46E5', 'edgeLabelBackground':'#ffffff', 'tertiaryColor': '#F3F4F6'}}}%%
graph TB
    subgraph APP["src/app"]
        store["store.ts"]
        routes["routes.tsx"]
    end

    subgraph COMPONENTS["src/components"]
        subgraph COMMON["common/"]
            Button["Button.tsx"]
            Card["Card.tsx"]
            Input["Input.tsx"]
            Select["Select.tsx"]
            Table["Table.tsx"]
            Search["Search.tsx"]
            Filter["Filter.tsx"]
            Preferences["Preferences.tsx"]
        end
        Header["Header/"]
        Footer["Footer/"]
    end

    subgraph FEATURES["src/features"]
        AUTH["auth/"]
        STUDENT["student/"]
        FACULTY["faculty/"]
        PARENT["parent/"]
        ADMIN["administration/"]
        HOME["Home/"]
    end

    ASSETS["src/assets"]
    CONFIG["src/config"]
```

---

## 2. Component Diagram - Feature Module Structure

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4F46E5'}}}%%
classDiagram
    class FeatureModule {
        +api
        +components
        +layout
        +pages
        +routes
        +store
        +types
    }

    class Auth {
        +api
        +components
        +layout
        +pages
        +routes
        +services
        +store
        +types
    }

    class Student {
        +api
        +components
        +layout
        +pages
        +routes
    }

    class Faculty {
        +components
        +layout
        +pages
        +routes
        +store
    }

    class Parent {
        +components
        +layout
        +pages
        +routes
        +store
    }

    class Administration {
        +api
        +components
        +layout
        +pages
        +routes
        +store
        +types
    }

    FeatureModule <|-- Auth
    FeatureModule <|-- Student
    FeatureModule <|-- Faculty
    FeatureModule <|-- Parent
    FeatureModule <|-- Administration
```

---

## 3. Component Hierarchy Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#10B981'}}}%%
graph TD
    App[App.tsx] --> Router[Router Provider]
    
    subgraph PUBLIC["Public Routes"]
        Home[HomeLayout] --> HomePages[Home Pages]
        Auth[AuthLayout] --> AuthPages[Login/Register]
    end

    subgraph PROTECTED["Protected Routes"]
        Protected[Protected Route Wrapper]
        
        subgraph STUDENT_PAGES["Student Portal"]
            SLayout[StudentLayout] --> SDash[Dashboard]
            SLayout --> SAttend[Attendance]
            SLayout --> SMarks[Marks]
            SLayout --> SSubj[Subjects]
            SSubj --> SSubjDetail[SubjectDetails]
            SSubjDetail --> SAssign[AssignmentDetails]
            SLayout --> SAssignList[Assignments]
            SLayout --> SSch[Schedule]
            SLayout --> SMat[Materials]
        end

        subgraph FACULTY_PAGES["Faculty Portal"]
            FLayout[FacultyLayout] --> FDash[Dashboard]
            FLayout --> FAttend[Attendance]
            FLayout --> FRecord[Record Attendance]
            FLayout --> FMark[Mark Attendance]
            FLayout --> FMarks[Enter Marks]
            FLayout --> FClass[Classes]
            FLayout --> FStudents[Class Students]
            FLayout --> FSch[Schedule]
            FLayout --> FMat[Materials]
            FLayout --> FAss[Assessments]
            FLayout --> FReq[Request Materials]
            FLayout --> FPerf[Student Performance]
        end

        subgraph PARENT_PAGES["Parent Portal"]
            PLayout[ParentLayout] --> PDash[Dashboard]
            PLayout --> PAttend[Child Attendance]
            PLayout --> PPerf[Child Performance]
            PLayout --> PSubj[Subject Reports]
            PLayout --> PFees[Fees]
            PLayout --> PComm[Communication]
            PLayout --> PTimetable[Timetable]
        end

        subgraph ADMIN_PAGES["Administration Portal"]
            ALayout[AdministrationLayout] --> ADash[Dashboard]
            ALayout --> AStud[Manage Student Records]
            ALayout --> ASched[Schedule Management]
            ALayout --> AProm[Promote Students]
            ALayout --> AInv[Inventory Management]
            ALayout --> AReq[Request Management]
            ALayout --> AReportAtt[View Attendance Reports]
            ALayout --> AReportExam[View Exam Reports]
            ALayout --> AGrep[Generate Reports]
            ALayout --> AMon[Monitor Performance]
        end
    end

    Router --> PUBLIC
    Router --> PROTECTED
    Protected --> StudentLayout
    Protected --> FacultyLayout
    Protected --> ParentLayout
    Protected --> AdministrationLayout
```

---

## 4. State Management Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F59E0B'}}}%%
graph LR
    subgraph ReduxStore["Redux Store"]
        auth[auth slice]
        studentAPI[Student API]
        facultyAPI[Faculty API]
        parentAPI[Parent API]
        adminAPI[Admin API]
    end

    subgraph AuthState["Auth State"]
        isAuth[isAuthenticated: boolean]
        token[jwt: string]
        user[user: User]
    end

    auth --> AuthState
    
    API[Component
    useQuery/useMutation] --> RTKQ[RTK Query]
    RTKQ --> Cache[Cache Manager]
    Cache --> Endpoints[API Endpoints]
    
    studentAPI -.-> API
    facultyAPI -.-> API
    parentAPI -.-> API
    adminAPI -.-> API
```

---

## 5. Route Protection Flow Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#EF4444'}}}%%
flowchart TD
    Start([User Visits URL]) --> CheckAuth{Is Authenticated?}
    
    CheckAuth -->|No| RedirectLogin["Redirect to /auth/login"]
    RedirectLogin --> Login[Login Page]
    
    CheckAuth -->|Yes| CheckRole{Has Valid Role?}
    
    CheckRole -->|No| RedirectDashboard["Redirect to Role Dashboard"]
    
    CheckRole -->|Yes| LoadLayout["Load Role Layout"]
    LoadLayout --> Sidebar[Sidebar Navigation]
    Sidebar --> Header[Header]
    Header --> Content[Outlet - Page Content]
```

---

## 6. Data Flow Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#8B5CF6'}}}%%
sequenceDiagram
    participant User
    participant Component
    participant RTKQuery
    participant Cache
    participant API

    User->>Component: Interacts
    Component->>RTKQuery: useQuery hook
    RTKQuery->>Cache: Check Cache
    
    alt Cache Valid
        Cache-->>Component: Return Cached Data
    else Cache Invalid/Missing
        RTKQuery->>API: Fetch Data
        API-->>RTKQuery: Response
        RTKQuery->>Cache: Update Cache
        RTKQuery-->>Component: Return Data
    end
    
    Component-->>User: Display Data
    
    alt Write Operation
        Component->>RTKQuery: useMutation
        RTKQuery->>API: POST/PUT/DELETE
        API-->>RTKQuery: Confirmation
        RTKQuery->>Cache: Invalidate/Update
        RTKQuery-->>Component: Success/Error
    end
```

---

## 7. Common Components Class Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#06B6D4'}}}%%
classDiagram
    class Button {
        <<interface>>
        +variant: string
        +size: string
        +icon: ReactNode
        +onClick() void
        +children: ReactNode
    }

    class Card {
        <<interface>>
        +children: ReactNode
        +padding: string
        +hover: boolean
        +onClick() void
    }

    class Input {
        <<interface>>
        +label: string
        +error: string
        +size: string
        +icon: ReactNode
        +iconPosition: string
        +onChange() void
    }

    class Select {
        <<interface>>
        +label: string
        +options: SelectOption[]
        +value: string
        +onChange() void
    }

    class Table {
        <<interface>>
        +columns: TableColumn[]
        +data: any[]
        +searchable: boolean
        +pagination: boolean
    }

    class Search {
        <<interface>>
        +config: SearchConfig
        +variant: string
        +onSearch() void
    }

    class Filter {
        <<interface>>
        +options: FilterOption[]
        +onChange() void
    }
```

---

## 8. Student Subject Flow Activity Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#EC4899'}}}%%
flowchart TD
    Start([Student Clicks Subjects]) --> Navigate1[/student/subjects]
    Navigate1 --> SubjectList[Display Subject Cards]
    
    SubjectList --> ClickSubject{Click Subject}
    ClickSubject --> Navigate2[/student/subjects/:name]
    Navigate2 --> SubjectDetails[Subject Details Page]
    
    SubjectDetails --> Tab1{Chapters Tab}
    Tab1 --> ShowChapters[Show Chapters with Weekly Topics]
    ShowChapters --> SelectChapter[Click to Expand]
    SelectChapter --> WeeklyBreakdown[Show Weekly Breakdown]
    
    SubjectDetails --> Tab2{Materials Tab}
    Tab2 --> ShowMaterials[Show Materials Grouped by Week]
    ShowMaterials --> Download[Download Material]
    
    SubjectDetails --> Tab3{Assignments Tab}
    Tab3 --> ShowAssignments[Show Assignment List]
    ShowAssignments --> ClickAssign[Click Assignment]
    ClickAssign --> Navigate3[/student/assignments/:id]
    Navigate3 --> Questions[Display Questions]
    
    Questions --> FillMCQ[Fill MCQ]
    Questions --> FillObjective[Fill Objective]
    Questions --> FillSubjective[Fill Subjective]
    
    FillMCQ --> Submit1[Submit Assignment]
    FillObjective --> Submit1
    FillSubjective --> Submit1
    
    Submit1 --> Success[Show Success Message]
```

---

## 9. Component Composition Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#84CC16'}}}%%
graph TB
    subgraph Layouts
        HL[HomeLayout]
        AL[AuthLayout]
        SL[StudentLayout]
        FL[FacultyLayout]
        PL[ParentLayout]
        AdL[AdministrationLayout]
    end

    subgraph Shared
        Header[Header Component]
        Sidebar[Sidebar Component]
        Preferences[Preferences Modal]
    end

    subgraph CommonComponents
        Button
        Card
        Input
        Select
        Table
        Search
        Filter
    end

    HL --> Header
    AL --> Header
    SL --> Header
    SL --> Sidebar
    FL --> Header
    FL --> Sidebar
    PL --> Header
    PL --> Sidebar
    AdL --> Header
    AdL --> Sidebar

    Header --> Preferences
    Sidebar --> CommonComponents
    CommonComponents --> Button
    CommonComponents --> Card
    CommonComponents --> Input
    CommonComponents --> Select
    CommonComponents --> Table
    CommonComponents --> Search
    CommonComponents --> Filter
```

---

## 10. Use Case Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F97316'}}}%%
graph TD
    subgraph Actors
        Student[Student]
        Faculty[Faculty/Teacher]
        Parent[Parent]
        Admin[Administrator]
    end

    subgraph StudentUseCases
        ViewDashS[View Dashboard]
        ViewAttend[View Attendance]
        ViewMarks[View Marks]
        BrowseSubj[Browse Subjects]
        ViewSubjDetail[View Subject Details]
        SubmitAssign[Submit Assignment]
        ViewMaterials[View Materials]
        ViewSchedule[View Schedule]
    end

    subgraph FacultyUseCases
        ViewDashF[View Dashboard]
        RecordAttend[Record Attendance]
        EnterMarks[Enter Marks]
        UploadMaterials[Upload Materials]
        CreateAssess[Create Assessment]
        ViewClasses[View Classes]
        ViewSch[View Schedule]
    end

    subgraph ParentUseCases
        ViewDashP[View Dashboard]
        ViewChildAttend[View Child Attendance]
        ViewChildPerf[View Child Performance]
        PayFees[Pay Fees]
        ViewComm[View Communications]
        ViewTimetable[View Timetable]
    end

    subgraph AdminUseCases
        ViewDashA[View Dashboard]
        ManageStudents[Manage Students]
        ManageSchedule[Manage Schedule]
        Inventory[Manage Inventory]
        ReviewRequests[Review Requests]
        GenerateReports[Generate Reports]
        ViewReports[View Reports]
    end

    Student --> StudentUseCases
    Faculty --> FacultyUseCases
    Parent --> ParentUseCases
    Admin --> AdminUseCases
```

---

## 11. Deployment Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#6366F1'}}}%%
graph TB
    subgraph Client["Client Side (Browser)"]
        Browser[React Application]
        LocalStorage[Local Storage]
        Session[Session Storage]
    end

    subgraph Build["Build Process"]
        Vite[Vite Build Tool]
        TypeScript[TypeScript Compiler]
        Tailwind[Tailwind CSS]
    end

    subgraph Server["Server/API"]
        API[REST API]
        AuthServer[Auth Server]
    end

    subgraph Development["Development"]
        DevServer[Vite Dev Server]
        HMR[Hot Module Replacement]
    end

    Browser -->|HTTP Requests| API
    Browser -->|Auth| AuthServer
    Browser -->|Store| LocalStorage
    
    DevServer --> HMR
    HMR --> Browser
    
    Vite --> Build
    TypeScript --> Build
    Tailwind --> Build
    
    Build -->|Production Bundle| Browser
```

---

## View Diagrams

To view these diagrams, you can use:
1. **Mermaid Live Editor**: https://mermaid.live/
2. **VS Code**: Install "Mermaid Preview" or "Mermaid Markdown Preview" extension
3. **Notion/Obsidian**: Native Mermaid support
4. **GitHub**: Rendered automatically in markdown files

Example rendering in markdown:
```markdown
```mermaid
// diagram code here
```
```
