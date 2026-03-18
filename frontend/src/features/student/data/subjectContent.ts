export interface SubjectChapter {
  id: string;
  title: string;
  summary: string;
  description: string;
  headings: { title: string; content: string }[];
  weeklyTopics: { week: string; topic: string; focus: string }[];
}

export interface SubjectMaterial {
  id: string;
  title: string;
  type: "notes" | "video" | "pdf" | "worksheet";
  week: string;
  uploadedAt: string;
  description: string;
}

export interface SubjectAssignment {
  id: string;
  title: string;
  type: "objective" | "subjective" | "mcq" | "mixed";
  week: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  marks?: number;
  totalMarks: number;
  description: string;
}

export interface StudentSubjectData {
  name: string;
  code: string;
  teacher: string;
  description: string;
  progressLabel: string;
  chapters: SubjectChapter[];
  materials: SubjectMaterial[];
  assignments: SubjectAssignment[];
}

export const studentSubjectContent: Record<string, StudentSubjectData> = {
  Mathematics: {
    name: "Mathematics",
    code: "MATH-10",
    teacher: "Ms. Kavya Rao",
    description: "Build confidence in algebra, coordinate geometry, and problem solving through structured chapter progress and guided practice.",
    progressLabel: "78% chapter progress",
    chapters: [
      {
        id: "math-ch1",
        title: "Algebra Fundamentals",
        summary: "Understand expressions, variables, and linear equations as the base of the subject.",
        description: "This chapter introduces the language of algebra and helps students move from arithmetic patterns to symbolic reasoning. It focuses on simplifying expressions, identifying variables, and solving basic equations with confidence.",
        headings: [
          {
            title: "Core Ideas",
            content: "Students learn how variables represent unknown values, how like terms are combined, and how equations model real situations.",
          },
          {
            title: "Why It Matters",
            content: "Algebra becomes the foundation for later chapters like quadratic equations and coordinate geometry, so clarity here improves performance across the entire subject.",
          },
        ],
        weeklyTopics: [
          { week: "Week 1", topic: "Introduction to Algebra", focus: "Variables, constants, and simple algebraic expressions." },
          { week: "Week 2", topic: "Linear Equations", focus: "Balancing equations and solving one-variable problems." },
        ],
      },
      {
        id: "math-ch2",
        title: "Quadratic Equations",
        summary: "Learn how to solve second-degree equations using factorization and formula methods.",
        description: "This chapter expands equation-solving into quadratic form and builds accuracy in identifying roots, factoring expressions, and applying standard methods to structured and word-based problems.",
        headings: [
          {
            title: "Core Ideas",
            content: "Students compare different solving methods, identify the discriminant idea informally, and understand how roots relate to the equation.",
          },
          {
            title: "Practice Focus",
            content: "Most success in this chapter comes from repeated practice with factorization patterns and careful substitution into formulas.",
          },
        ],
        weeklyTopics: [
          { week: "Week 3", topic: "Factorization", focus: "Breaking quadratic expressions into simpler factors." },
          { week: "Week 4", topic: "Quadratic Formula", focus: "Applying the formula correctly and checking solutions." },
        ],
      },
      {
        id: "math-ch3",
        title: "Coordinate Geometry",
        summary: "Use points and formulas on the Cartesian plane to solve distance and section problems.",
        description: "This chapter connects geometry with algebra. Students interpret points on a graph, calculate distances, and divide line segments in given ratios using coordinate-based reasoning.",
        headings: [
          {
            title: "Core Ideas",
            content: "Points, axes, plotting, and formula-based reasoning help students convert diagrams into numerical solutions.",
          },
          {
            title: "Application",
            content: "Problems in this chapter often link visual understanding with calculation, so diagram reading is just as important as formula use.",
          },
        ],
        weeklyTopics: [
          { week: "Week 5", topic: "Distance Formula", focus: "Finding length between two points on the plane." },
          { week: "Week 6", topic: "Section Formula", focus: "Dividing a segment internally in a ratio." },
        ],
      },
    ],
    materials: [
      { id: "math-m1", title: "Algebra Basics Notes", type: "notes", week: "Week 1", uploadedAt: "15 Jan 2026", description: "Teacher notes covering terms, identities, and worked examples." },
      { id: "math-m2", title: "Equation Practice Sheet", type: "worksheet", week: "Week 2", uploadedAt: "19 Jan 2026", description: "A guided worksheet to strengthen equation-solving speed." },
      { id: "math-m3", title: "Quadratic Revision PDF", type: "pdf", week: "Week 4", uploadedAt: "02 Feb 2026", description: "Revision summary with standard forms and shortcut reminders." },
      { id: "math-m4", title: "Coordinate Geometry Video", type: "video", week: "Week 5", uploadedAt: "10 Feb 2026", description: "A recorded explanation of distance and section formula applications." },
    ],
    assignments: [
      { id: "math-a1", title: "Algebra Skill Check", type: "mixed", week: "Week 2", dueDate: "20 Mar 2026", status: "graded", marks: 18, totalMarks: 20, description: "Short questions on expressions and solving equations." },
      { id: "math-a2", title: "Quadratic Practice Set", type: "objective", week: "Week 4", dueDate: "25 Mar 2026", status: "submitted", totalMarks: 30, description: "Objective paper focused on roots and factorization." },
      { id: "math-a3", title: "Coordinate Geometry Homework", type: "subjective", week: "Week 6", dueDate: "29 Mar 2026", status: "pending", totalMarks: 25, description: "Long-form solutions using graph-based reasoning." },
    ],
  },
  Physics: {
    name: "Physics",
    code: "PHY-10",
    teacher: "Mr. Arvind Kumar",
    description: "Understand motion, force, and energy through concept notes, visual explanations, and numericals.",
    progressLabel: "64% chapter progress",
    chapters: [
      {
        id: "phy-ch1",
        title: "Kinematics",
        summary: "Study speed, velocity, and acceleration to describe motion clearly.",
        description: "Kinematics introduces how motion is measured and compared. Students work with distance-time relationships, velocity changes, and the language used to describe moving objects.",
        headings: [
          { title: "Core Ideas", content: "Distance, displacement, speed, velocity, and acceleration are introduced through numerical and real-world examples." },
          { title: "Problem Strategy", content: "Units, signs, and choosing the right quantity are essential for solving kinematics correctly." },
        ],
        weeklyTopics: [
          { week: "Week 1", topic: "Speed and Velocity", focus: "Comparing scalar and vector ideas in simple motion." },
          { week: "Week 2", topic: "Acceleration", focus: "Understanding rate of change in velocity." },
        ],
      },
      {
        id: "phy-ch2",
        title: "Laws of Motion",
        summary: "Apply Newton’s laws to explain how and why objects move or resist motion.",
        description: "Students connect force and motion in a structured way, learning how inertia, net force, and action-reaction pairs explain everyday motion.",
        headings: [
          { title: "Core Ideas", content: "Newton’s three laws are studied through conceptual examples and numerical application." },
          { title: "Real-World Link", content: "Seatbelts, pushing objects, and collisions help students visualize these laws beyond the textbook." },
        ],
        weeklyTopics: [
          { week: "Week 3", topic: "First and Second Law", focus: "Inertia, force, and acceleration relationships." },
          { week: "Week 4", topic: "Third Law", focus: "Action-reaction understanding in common situations." },
        ],
      },
    ],
    materials: [
      { id: "phy-m1", title: "Kinematics Summary Notes", type: "notes", week: "Week 1", uploadedAt: "16 Jan 2026", description: "Class notes on key definitions and formula use." },
      { id: "phy-m2", title: "Motion Numericals PDF", type: "pdf", week: "Week 2", uploadedAt: "21 Jan 2026", description: "Practice set for acceleration and velocity problems." },
      { id: "phy-m3", title: "Laws of Motion Video", type: "video", week: "Week 4", uploadedAt: "05 Feb 2026", description: "Visual explanation of Newton’s laws with examples." },
    ],
    assignments: [
      { id: "phy-a1", title: "Kinematics Quiz", type: "mcq", week: "Week 2", dueDate: "21 Mar 2026", status: "graded", marks: 16, totalMarks: 20, description: "Concept and formula check on motion." },
      { id: "phy-a2", title: "Force and Motion Worksheet", type: "mixed", week: "Week 4", dueDate: "28 Mar 2026", status: "pending", totalMarks: 25, description: "Mixed questions covering Newton’s laws." },
    ],
  },
  Chemistry: {
    name: "Chemistry",
    code: "CHEM-10",
    teacher: "Mrs. Sana Ali",
    description: "Explore atoms, bonding, and reactions with chapter summaries and structured worksheets.",
    progressLabel: "58% chapter progress",
    chapters: [
      {
        id: "chem-ch1",
        title: "Atomic Structure",
        summary: "Learn how atoms are built and how electrons are arranged.",
        description: "This chapter explains the structure of matter at the atomic level, giving students a foundation for later chemical behavior and reactions.",
        headings: [
          { title: "Core Ideas", content: "Atomic models, subatomic particles, and electron arrangement form the backbone of this chapter." },
          { title: "Exam Focus", content: "Diagram understanding and terminology are especially important here." },
        ],
        weeklyTopics: [
          { week: "Week 1", topic: "Bohr Model", focus: "Basic structure of the atom and shell arrangement." },
          { week: "Week 2", topic: "Electronic Configuration", focus: "Writing shell-wise distribution of electrons." },
        ],
      },
      {
        id: "chem-ch2",
        title: "Chemical Bonding",
        summary: "Understand why atoms combine and how different bonds are formed.",
        description: "Students compare ionic and covalent bonding, examine electron sharing and transfer, and connect bonding to chemical properties.",
        headings: [
          { title: "Core Ideas", content: "Electron transfer, electron sharing, and stability explain why compounds form." },
          { title: "Application", content: "Students learn to connect bond type with examples and compound structure." },
        ],
        weeklyTopics: [
          { week: "Week 3", topic: "Ionic Bonding", focus: "Formation by electron transfer and ions." },
          { week: "Week 4", topic: "Covalent Bonding", focus: "Electron sharing and molecule formation." },
        ],
      },
    ],
    materials: [
      { id: "chem-m1", title: "Atomic Structure Notes", type: "notes", week: "Week 1", uploadedAt: "17 Jan 2026", description: "Short reference notes and diagrams." },
      { id: "chem-m2", title: "Bonding Comparison Worksheet", type: "worksheet", week: "Week 4", uploadedAt: "08 Feb 2026", description: "Practice comparing ionic and covalent compounds." },
    ],
    assignments: [
      { id: "chem-a1", title: "Atomic Structure Check", type: "mcq", week: "Week 2", dueDate: "22 Mar 2026", status: "pending", totalMarks: 20, description: "Quick MCQ check on structure and configuration." },
      { id: "chem-a2", title: "Bonding Concepts Write-up", type: "subjective", week: "Week 4", dueDate: "30 Mar 2026", status: "submitted", totalMarks: 20, description: "Short-answer explanation of bond types." },
    ],
  },
  English: {
    name: "English",
    code: "ENG-10",
    teacher: "Ms. Deepa Nair",
    description: "Strengthen grammar, comprehension, literature understanding, and writing skills.",
    progressLabel: "71% chapter progress",
    chapters: [
      {
        id: "eng-ch1",
        title: "Reading Comprehension",
        summary: "Improve understanding, inference, and evidence-based answering from passages.",
        description: "Students practice reading with purpose, identifying main ideas, extracting evidence, and presenting accurate written responses.",
        headings: [
          { title: "Core Ideas", content: "Skimming, scanning, inference, and identifying tone improve comprehension performance." },
          { title: "Writing Link", content: "Strong comprehension also supports better answers in literature and composition." },
        ],
        weeklyTopics: [
          { week: "Week 1", topic: "Main Idea and Detail", focus: "Reading for explicit understanding." },
          { week: "Week 2", topic: "Inference and Tone", focus: "Reading between the lines." },
        ],
      },
      {
        id: "eng-ch2",
        title: "Grammar and Usage",
        summary: "Refine sentence accuracy, tense usage, and editing skills.",
        description: "This chapter improves clarity in writing by focusing on grammar accuracy, sentence correction, and language control.",
        headings: [
          { title: "Core Ideas", content: "Tenses, subject-verb agreement, and editing patterns are emphasized." },
          { title: "Practice Focus", content: "Frequent short exercises help grammar become automatic in writing tasks." },
        ],
        weeklyTopics: [
          { week: "Week 3", topic: "Tenses", focus: "Using correct verb forms in context." },
          { week: "Week 4", topic: "Editing Sentences", focus: "Finding and correcting common grammar errors." },
        ],
      },
    ],
    materials: [
      { id: "eng-m1", title: "Reading Strategies Sheet", type: "pdf", week: "Week 1", uploadedAt: "14 Jan 2026", description: "A compact guide to passage-solving techniques." },
      { id: "eng-m2", title: "Grammar Practice Notes", type: "notes", week: "Week 3", uploadedAt: "01 Feb 2026", description: "Examples and rules for tenses and corrections." },
    ],
    assignments: [
      { id: "eng-a1", title: "Comprehension Practice", type: "objective", week: "Week 2", dueDate: "24 Mar 2026", status: "graded", marks: 17, totalMarks: 20, description: "Passage-based written answers." },
      { id: "eng-a2", title: "Grammar Editing Task", type: "mixed", week: "Week 4", dueDate: "27 Mar 2026", status: "pending", totalMarks: 15, description: "Editing and transformation practice set." },
    ],
  },
  "Computer Science": {
    name: "Computer Science",
    code: "CS-10",
    teacher: "Mr. Rohit Verma",
    description: "Learn programming logic, algorithms, and practical coding through structured chapter content.",
    progressLabel: "83% chapter progress",
    chapters: [
      {
        id: "cs-ch1",
        title: "Programming Basics",
        summary: "Understand syntax, variables, operators, and basic program flow.",
        description: "Students learn how code is structured, how inputs and outputs work, and how variables and operators are used to solve simple problems.",
        headings: [
          { title: "Core Ideas", content: "Variables, expressions, input-output, and step-by-step logic form the starting point of coding." },
          { title: "Practical Value", content: "A strong base here helps students write cleaner programs in every later chapter." },
        ],
        weeklyTopics: [
          { week: "Week 1", topic: "Variables and Data", focus: "Declaring and using simple values in programs." },
          { week: "Week 2", topic: "Operators", focus: "Using arithmetic and logical operations correctly." },
        ],
      },
      {
        id: "cs-ch2",
        title: "Conditional Logic",
        summary: "Write decisions in code using conditional statements.",
        description: "This chapter shows students how programs make choices using conditions and branch logic based on different scenarios.",
        headings: [
          { title: "Core Ideas", content: "If, else, and nested conditions help programs react to input and rules." },
          { title: "Problem Solving", content: "Students begin writing programs that model real decision-based situations." },
        ],
        weeklyTopics: [
          { week: "Week 3", topic: "If-Else Blocks", focus: "Writing simple branching logic." },
          { week: "Week 4", topic: "Nested Conditions", focus: "Handling multiple checks clearly." },
        ],
      },
      {
        id: "cs-ch3",
        title: "Loops and Repetition",
        summary: "Automate repeated steps using loops and controlled iteration.",
        description: "Students use loops to reduce repeated code, improve efficiency, and solve pattern-based programming tasks.",
        headings: [
          { title: "Core Ideas", content: "For loops, while loops, counters, and stopping conditions are the main focus." },
          { title: "Coding Habit", content: "This chapter helps students think in patterns and write more efficient solutions." },
        ],
        weeklyTopics: [
          { week: "Week 5", topic: "For Loops", focus: "Fixed repetitions and counting patterns." },
          { week: "Week 6", topic: "While Loops", focus: "Condition-controlled repetition in programs." },
        ],
      },
    ],
    materials: [
      { id: "cs-m1", title: "Programming Basics Notes", type: "notes", week: "Week 1", uploadedAt: "18 Jan 2026", description: "Intro reference for code structure and syntax." },
      { id: "cs-m2", title: "Conditionals Practice PDF", type: "pdf", week: "Week 4", uploadedAt: "07 Feb 2026", description: "Decision-making programming exercises." },
      { id: "cs-m3", title: "Loops Demo Video", type: "video", week: "Week 6", uploadedAt: "18 Feb 2026", description: "Walkthrough of loop execution using examples." },
    ],
    assignments: [
      { id: "cs-a1", title: "Variables and Operators Quiz", type: "mcq", week: "Week 2", dueDate: "23 Mar 2026", status: "graded", marks: 19, totalMarks: 20, description: "Quick assessment on programming basics." },
      { id: "cs-a2", title: "Conditional Logic Task", type: "mixed", week: "Week 4", dueDate: "26 Mar 2026", status: "submitted", totalMarks: 25, description: "Program design based on conditions." },
      { id: "cs-a3", title: "Loop Practice Lab", type: "subjective", week: "Week 6", dueDate: "31 Mar 2026", status: "pending", totalMarks: 30, description: "Write and explain looping logic for given tasks." },
    ],
  },
};

export const studentSubjects = Object.values(studentSubjectContent);
