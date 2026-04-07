Prompts
Read /media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/CONTEXTS.md first.
Use it as project context, then inspect the relevant code files before editing.
If my change affects architecture, routes, API payloads, auth, models, store wiring, env vars, or feature structure, update CONTEXTS.md too.

Read CONTEXTS.md first. I’m changing <feature>. Follow the existing backend/frontend patterns and update CONTEXTS.md if the change affects shared context.


## Instructions
  - For backend
      - remove upcomming courses table and do some changes in subjects table add a column to store status of code like upcomming, active, inactive and rename subjects to courses table
      - and add few more columns to store courses related data
      - implement corporate-style payroll that include basic pay, deductions, allowances, and calcute salary based on attendance, salary slip download features, after paying salary send email with salary slip
      - student can enroll courses in one time payments or installments, after payment send email with reciept, note payment made by parent if parent not avaialbe then student can made payments
      - student, parent and faculty can see attendance reports of student and can downlaod also or send mail
      -  exam reports : student can see their example or assinment reports, parent also see reports, faculty also see reports and admininstration also see reports.
      -  exam reports made to see student assignment submission
      -  assessment data is stored on mongo db, assessement can see student via courses can submit then result restored in database after calculations of marks based on correct answers
      -  faculty can genrate assessments using llms based on study materials that availabes in courses week wise, faculty can add study materials and generate questions with answers that stores in mongo db. use rag to extracts informations from study materials. includes images if availabes in materials like pdf or others formates. note write rag code in seperate folders.
      -  for rag users can use api key and llm models cloud based or local llm. give options to set rate limits for adminstration.
      -  stores expenses details bases on inventory management so that total expanses and revenue calculations can be done.
      - implemets where report downloads or email send requires.
  - for frontend
    - do changes in frontend based on above changes in backend.
    - and integrate with backend also. use rtk query for data fetching.



use CONTEXTS.md pre and post context and update after code changes.
don't use two table subjects and courses  for  upcomming courses and purchased courses. use courses tables for both works.
implement rag for genrate questions.
assessment questions have text or test + images. rag use to generate questions by taking study materials.


give llm configures to administration like rate control, change llm api key, model etc.  and faculty can select study material, study material uplaod features and generate question and a option to manuly add questions also. note update CONTEXT.md after changes