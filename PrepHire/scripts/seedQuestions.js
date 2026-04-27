/**
 * Seed script — run once to populate the questions collection.
 * Usage: node scripts/seedQuestions.js
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://chandraanubhuti04:02komal@cluster0.seuoq1i.mongodb.net/';

const questions = [
  // ── FRONTEND ──────────────────────────────────────────────────────────────
  { question: "What is the DOM?", domain: "frontend", answer: "DOM is a tree-like structure representing HTML elements that JavaScript can manipulate.", keywords: { must: ["dom", "tree", "structure"], optional: ["html", "elements", "javascript", "manipulate"], synonyms: { tree: ["hierarchy"], manipulate: ["modify", "change"] } } },
  { question: "What is responsive design?", domain: "frontend", answer: "Responsive design ensures a website works on different screen sizes and devices.", keywords: { must: ["responsive", "design"], optional: ["screen", "devices", "mobile", "adapt"], synonyms: { adapt: ["adjust"] } } },
  { question: "What is Flexbox?", domain: "frontend", answer: "Flexbox is a CSS layout model used to align and distribute space among items.", keywords: { must: ["flexbox", "css"], optional: ["layout", "align", "space"], synonyms: { align: ["position"] } } },
  { question: "What is event bubbling?", domain: "frontend", answer: "Event bubbling is when events propagate from child to parent elements.", keywords: { must: ["event", "bubbling"], optional: ["propagation", "parent", "child"], synonyms: { propagation: ["flow"] } } },
  { question: "What is closure in JavaScript?", domain: "frontend", answer: "Closure is when a function remembers variables from its outer scope.", keywords: { must: ["closure", "function"], optional: ["scope", "outer", "variables"], synonyms: { outer: ["parent"] } } },
  { question: "Difference between var, let, const?", domain: "frontend", answer: "var is function scoped, let and const are block scoped, const cannot be reassigned.", keywords: { must: ["var", "let", "const", "scope"], optional: ["function", "block", "reassign"], synonyms: { reassign: ["change"] } } },
  { question: "What is hoisting?", domain: "frontend", answer: "Hoisting is JavaScript behavior where variables and functions are moved to the top of scope.", keywords: { must: ["hoisting"], optional: ["variables", "functions", "top", "scope"], synonyms: {} } },
  { question: "What is React?", domain: "frontend", answer: "React is a JavaScript library for building user interfaces using components.", keywords: { must: ["react", "javascript", "library"], optional: ["ui", "components"], synonyms: { ui: ["user interface"] } } },
  { question: "What is state in React?", domain: "frontend", answer: "State is data stored in a component that can change over time.", keywords: { must: ["state", "data"], optional: ["component", "change", "update"], synonyms: {} } },
  { question: "What is props?", domain: "frontend", answer: "Props are inputs passed to components to display data.", keywords: { must: ["props"], optional: ["data", "component", "input"], synonyms: {} } },
  { question: "What is virtual DOM?", domain: "frontend", answer: "Virtual DOM is a lightweight copy of real DOM used to improve performance.", keywords: { must: ["virtual", "dom"], optional: ["copy", "performance", "update"], synonyms: {} } },
  { question: "What is useEffect?", domain: "frontend", answer: "useEffect is a React hook used to handle side effects in components.", keywords: { must: ["useeffect", "hook"], optional: ["side", "effects", "component"], synonyms: {} } },
  { question: "What is REST API?", domain: "frontend", answer: "REST API allows communication between client and server using HTTP.", keywords: { must: ["rest", "api"], optional: ["http", "client", "server"], synonyms: {} } },
  { question: "What is CORS?", domain: "frontend", answer: "CORS allows or restricts resources between different domains.", keywords: { must: ["cors"], optional: ["domain", "request", "security"], synonyms: {} } },
  { question: "How to optimize website performance?", domain: "frontend", answer: "Optimize by reducing load time, using caching, and minimizing resources.", keywords: { must: ["optimize", "performance"], optional: ["cache", "load", "minimize"], synonyms: {} } },

  // ── BACKEND ───────────────────────────────────────────────────────────────
  { question: "What is Node.js?", domain: "backend", answer: "Node.js is a runtime environment to run JavaScript on the server.", keywords: { must: ["node", "javascript"], optional: ["runtime", "server"], synonyms: {} } },
  { question: "What is Express.js?", domain: "backend", answer: "Express.js is a web framework for Node.js used to build APIs.", keywords: { must: ["express"], optional: ["framework", "api", "node"], synonyms: {} } },
  { question: "What is middleware?", domain: "backend", answer: "Middleware functions process request and response in applications.", keywords: { must: ["middleware"], optional: ["request", "response", "function"], synonyms: {} } },
  { question: "Difference between GET and POST?", domain: "backend", answer: "GET retrieves data, POST sends data to server.", keywords: { must: ["get", "post"], optional: ["retrieve", "send", "data"], synonyms: {} } },
  { question: "What is authentication?", domain: "backend", answer: "Authentication verifies user identity.", keywords: { must: ["authentication"], optional: ["user", "identity", "verify"], synonyms: {} } },
  { question: "What is authorization?", domain: "backend", answer: "Authorization determines user access permissions.", keywords: { must: ["authorization"], optional: ["access", "permission"], synonyms: {} } },
  { question: "What is JWT?", domain: "backend", answer: "JWT is a token used for secure authentication.", keywords: { must: ["jwt", "token"], optional: ["authentication", "secure"], synonyms: {} } },
  { question: "What is hashing?", domain: "backend", answer: "Hashing converts data into fixed-size values for security.", keywords: { must: ["hashing"], optional: ["security", "data", "encrypt"], synonyms: {} } },
  { question: "What is MVC?", domain: "backend", answer: "MVC divides application into Model, View, Controller.", keywords: { must: ["mvc"], optional: ["model", "view", "controller"], synonyms: {} } },
  { question: "What is REST API?", domain: "backend", answer: "REST API uses HTTP methods to communicate between systems.", keywords: { must: ["rest", "api"], optional: ["http", "methods"], synonyms: {} } },
  { question: "What is database indexing?", domain: "backend", answer: "Indexing improves database query performance by quickly locating data.", keywords: { must: ["indexing"], optional: ["database", "performance", "query", "fast"], synonyms: { fast: ["quick", "speed"] } } },
  { question: "What is API rate limiting?", domain: "backend", answer: "Rate limiting restricts the number of API requests a client can make.", keywords: { must: ["rate", "limit"], optional: ["api", "requests", "restrict"], synonyms: { restrict: ["control"] } } },
  { question: "What is session management?", domain: "backend", answer: "Session management maintains user state across multiple requests.", keywords: { must: ["session"], optional: ["user", "state", "requests"], synonyms: {} } },
  { question: "What is scalability?", domain: "backend", answer: "Scalability is the ability of a system to handle increased load.", keywords: { must: ["scalability"], optional: ["load", "increase", "system"], synonyms: { load: ["traffic"] } } },
  { question: "What are microservices?", domain: "backend", answer: "Microservices is an architecture where applications are divided into small independent services.", keywords: { must: ["microservices"], optional: ["architecture", "services", "independent"], synonyms: {} } },

  // ── FULL STACK ────────────────────────────────────────────────────────────
  { question: "What is full stack development?", domain: "fullstack", answer: "Full stack development involves working on both frontend and backend of an application.", keywords: { must: ["full stack"], optional: ["frontend", "backend", "application"], synonyms: {} } },
  { question: "What is MERN stack?", domain: "fullstack", answer: "MERN stack includes MongoDB, Express, React, and Node.js.", keywords: { must: ["mern"], optional: ["mongodb", "express", "react", "node"], synonyms: {} } },
  { question: "How does frontend connect to backend?", domain: "fullstack", answer: "Frontend communicates with backend using APIs over HTTP requests.", keywords: { must: ["frontend", "backend"], optional: ["api", "http", "request"], synonyms: { request: ["call"] } } },
  { question: "What is API integration?", domain: "fullstack", answer: "API integration connects frontend with backend services to exchange data.", keywords: { must: ["api", "integration"], optional: ["data", "connect", "frontend", "backend"], synonyms: {} } },
  { question: "What is CRUD?", domain: "fullstack", answer: "CRUD stands for Create, Read, Update, and Delete operations.", keywords: { must: ["crud"], optional: ["create", "read", "update", "delete"], synonyms: {} } },
  { question: "What is MongoDB?", domain: "fullstack", answer: "MongoDB is a NoSQL database that stores data in JSON-like documents.", keywords: { must: ["mongodb"], optional: ["nosql", "database", "json", "document"], synonyms: {} } },
  { question: "What is routing?", domain: "fullstack", answer: "Routing determines how requests are handled and which endpoints are called.", keywords: { must: ["routing"], optional: ["request", "endpoint", "url"], synonyms: {} } },
  { question: "What is state management?", domain: "fullstack", answer: "State management handles application data flow and state changes.", keywords: { must: ["state"], optional: ["data", "management", "change"], synonyms: {} } },
  { question: "What is deployment?", domain: "fullstack", answer: "Deployment is the process of making an application live on a server.", keywords: { must: ["deployment"], optional: ["server", "live", "host"], synonyms: { host: ["deploy"] } } },
  { question: "What is Git?", domain: "fullstack", answer: "Git is a version control system used to track code changes.", keywords: { must: ["git"], optional: ["version", "control", "track"], synonyms: {} } },
  { question: "What is version control?", domain: "fullstack", answer: "Version control manages changes to code over time.", keywords: { must: ["version", "control"], optional: ["code", "changes", "history"], synonyms: {} } },
  { question: "What are environment variables?", domain: "fullstack", answer: "Environment variables store configuration values outside the code.", keywords: { must: ["environment"], optional: ["variables", "config", "secure"], synonyms: { config: ["configuration"] } } },
  { question: "How do you handle errors?", domain: "fullstack", answer: "Errors are handled using try-catch blocks and proper validation.", keywords: { must: ["error"], optional: ["try", "catch", "validation"], synonyms: {} } },
  { question: "What is authentication flow?", domain: "fullstack", answer: "Authentication flow verifies users and grants access using tokens or sessions.", keywords: { must: ["authentication"], optional: ["user", "token", "session"], synonyms: {} } },
  { question: "How do you structure a full stack project?", domain: "fullstack", answer: "A full stack project is structured into frontend, backend, and database layers.", keywords: { must: ["structure"], optional: ["frontend", "backend", "database"], synonyms: {} } },

  // ── DATA SCIENCE ──────────────────────────────────────────────────────────
  { question: "What is data science?", domain: "data_science", answer: "Data science involves extracting insights from data using algorithms and analysis.", keywords: { must: ["data", "science"], optional: ["analysis", "insight", "algorithm"], synonyms: {} } },
  { question: "Difference between AI, ML, DL?", domain: "data_science", answer: "AI is broad, ML is learning from data, DL uses neural networks.", keywords: { must: ["ai", "ml", "dl"], optional: ["learning", "data", "neural"], synonyms: {} } },
  { question: "What is supervised learning?", domain: "data_science", answer: "Supervised learning uses labeled data to train models.", keywords: { must: ["supervised"], optional: ["labeled", "data", "training"], synonyms: {} } },
  { question: "What is unsupervised learning?", domain: "data_science", answer: "Unsupervised learning finds patterns in unlabeled data.", keywords: { must: ["unsupervised"], optional: ["pattern", "data", "unlabeled"], synonyms: {} } },
  { question: "What is regression?", domain: "data_science", answer: "Regression predicts continuous values.", keywords: { must: ["regression"], optional: ["predict", "continuous"], synonyms: {} } },
  { question: "What is classification?", domain: "data_science", answer: "Classification predicts categories or classes.", keywords: { must: ["classification"], optional: ["category", "class", "predict"], synonyms: {} } },
  { question: "What is overfitting?", domain: "data_science", answer: "Overfitting occurs when a model performs well on training but poorly on new data.", keywords: { must: ["overfitting"], optional: ["training", "data", "poor", "generalization"], synonyms: {} } },
  { question: "What is pandas?", domain: "data_science", answer: "Pandas is a Python library used for data manipulation and analysis.", keywords: { must: ["pandas"], optional: ["python", "data", "analysis"], synonyms: {} } },
  { question: "What is NumPy?", domain: "data_science", answer: "NumPy is a library used for numerical computations in Python.", keywords: { must: ["numpy"], optional: ["python", "numerical", "array"], synonyms: {} } },
  { question: "What is data cleaning?", domain: "data_science", answer: "Data cleaning involves removing errors and inconsistencies from data.", keywords: { must: ["cleaning"], optional: ["data", "errors", "remove"], synonyms: {} } },
  { question: "What is normalization?", domain: "data_science", answer: "Normalization scales data to a standard range.", keywords: { must: ["normalization"], optional: ["scale", "data", "range"], synonyms: {} } },
  { question: "What is data visualization?", domain: "data_science", answer: "Data visualization represents data using charts and graphs.", keywords: { must: ["visualization"], optional: ["data", "chart", "graph"], synonyms: {} } },
  { question: "What is model accuracy?", domain: "data_science", answer: "Accuracy measures how correct a model's predictions are.", keywords: { must: ["accuracy"], optional: ["model", "prediction", "correct"], synonyms: {} } },
  { question: "What is confusion matrix?", domain: "data_science", answer: "Confusion matrix shows actual vs predicted values in classification.", keywords: { must: ["confusion", "matrix"], optional: ["actual", "predicted", "classification"], synonyms: {} } },
  { question: "What is feature engineering?", domain: "data_science", answer: "Feature engineering involves creating useful input variables for models.", keywords: { must: ["feature"], optional: ["engineering", "input", "model"], synonyms: {} } },

  // ── DEVOPS ────────────────────────────────────────────────────────────────
  { question: "What is DevOps?", domain: "devops", answer: "DevOps is a practice that combines development and operations to improve software delivery.", keywords: { must: ["devops"], optional: ["development", "operations", "delivery"], synonyms: {} } },
  { question: "What is CI/CD?", domain: "devops", answer: "CI/CD automates integration and deployment of code changes.", keywords: { must: ["ci", "cd"], optional: ["automation", "deployment", "integration"], synonyms: {} } },
  { question: "What is Docker?", domain: "devops", answer: "Docker is a tool used to create and run containers.", keywords: { must: ["docker"], optional: ["container", "run", "build"], synonyms: {} } },
  { question: "What is Kubernetes?", domain: "devops", answer: "Kubernetes is used to manage and orchestrate containers.", keywords: { must: ["kubernetes"], optional: ["container", "orchestrate", "manage"], synonyms: {} } },
  { question: "What is cloud computing?", domain: "devops", answer: "Cloud computing provides computing resources over the internet.", keywords: { must: ["cloud"], optional: ["internet", "resources", "server"], synonyms: {} } },
  { question: "What are IaaS, PaaS, SaaS?", domain: "devops", answer: "They are cloud service models: infrastructure, platform, and software as a service.", keywords: { must: ["iaas", "paas", "saas"], optional: ["cloud", "service", "model"], synonyms: {} } },
  { question: "What is AWS?", domain: "devops", answer: "AWS is a cloud platform providing computing and storage services.", keywords: { must: ["aws"], optional: ["cloud", "services", "amazon"], synonyms: {} } },
  { question: "What is load balancing?", domain: "devops", answer: "Load balancing distributes traffic across multiple servers.", keywords: { must: ["load", "balancing"], optional: ["traffic", "server", "distribute"], synonyms: {} } },
  { question: "What is containerization?", domain: "devops", answer: "Containerization packages applications with dependencies into containers.", keywords: { must: ["container"], optional: ["application", "dependency", "package"], synonyms: {} } },
  { question: "What is Jenkins?", domain: "devops", answer: "Jenkins is a tool used for automating CI/CD pipelines.", keywords: { must: ["jenkins"], optional: ["automation", "pipeline", "ci"], synonyms: {} } },
  { question: "What is infrastructure as code?", domain: "devops", answer: "Infrastructure as code manages infrastructure using code instead of manual processes.", keywords: { must: ["infrastructure"], optional: ["code", "automation", "config"], synonyms: {} } },
  { question: "What is monitoring?", domain: "devops", answer: "Monitoring tracks system performance and health.", keywords: { must: ["monitoring"], optional: ["performance", "system", "track"], synonyms: {} } },
  { question: "What is scaling?", domain: "devops", answer: "Scaling increases system capacity to handle more load.", keywords: { must: ["scaling"], optional: ["load", "capacity", "increase"], synonyms: {} } },
  { question: "What is serverless?", domain: "devops", answer: "Serverless allows running code without managing servers.", keywords: { must: ["serverless"], optional: ["server", "manage", "code"], synonyms: {} } },
  { question: "What is version control in DevOps?", domain: "devops", answer: "Version control tracks and manages code changes.", keywords: { must: ["version", "control"], optional: ["code", "changes", "track"], synonyms: {} } },

  // ── PRODUCT MANAGEMENT ────────────────────────────────────────────────────
  { question: "What is product management?", domain: "product", answer: "Product management involves planning and managing a product lifecycle.", keywords: { must: ["product"], optional: ["management", "lifecycle", "plan"], synonyms: {} } },
  { question: "What is product lifecycle?", domain: "product", answer: "Product lifecycle includes stages from idea to launch and growth.", keywords: { must: ["lifecycle"], optional: ["product", "stage", "launch"], synonyms: {} } },
  { question: "What is MVP?", domain: "product", answer: "MVP is a minimum viable product with basic features.", keywords: { must: ["mvp"], optional: ["minimum", "viable", "product"], synonyms: {} } },
  { question: "How do you prioritize features?", domain: "product", answer: "Features are prioritized based on impact and user needs.", keywords: { must: ["prioritize"], optional: ["features", "impact", "user"], synonyms: {} } },
  { question: "What is a user story?", domain: "product", answer: "A user story describes functionality from the user perspective.", keywords: { must: ["user", "story"], optional: ["requirement", "feature", "user"], synonyms: {} } },
  { question: "What is a roadmap?", domain: "product", answer: "A roadmap outlines future product plans and features.", keywords: { must: ["roadmap"], optional: ["plan", "feature", "future"], synonyms: {} } },
  { question: "What is KPI?", domain: "product", answer: "KPI measures performance of a product or business.", keywords: { must: ["kpi"], optional: ["performance", "measure"], synonyms: {} } },
  { question: "What is A/B testing?", domain: "product", answer: "A/B testing compares two versions to find better performance.", keywords: { must: ["a/b"], optional: ["test", "compare", "performance"], synonyms: {} } },
  { question: "How do you handle user feedback?", domain: "product", answer: "User feedback is analyzed to improve product features.", keywords: { must: ["feedback"], optional: ["user", "analyze", "improve"], synonyms: {} } },
  { question: "What is market research?", domain: "product", answer: "Market research analyzes users and competitors.", keywords: { must: ["market"], optional: ["research", "user", "competitor"], synonyms: {} } },
  { question: "What is stakeholder management?", domain: "product", answer: "Stakeholder management involves communicating with project stakeholders.", keywords: { must: ["stakeholder"], optional: ["communication", "management"], synonyms: {} } },
  { question: "What is Agile?", domain: "product", answer: "Agile is an iterative development methodology.", keywords: { must: ["agile"], optional: ["iteration", "development", "method"], synonyms: {} } },
  { question: "What is Scrum?", domain: "product", answer: "Scrum is an Agile framework with sprints and roles.", keywords: { must: ["scrum"], optional: ["sprint", "framework", "team"], synonyms: {} } },
  { question: "What is a backlog?", domain: "product", answer: "Backlog is a list of tasks or features to be completed.", keywords: { must: ["backlog"], optional: ["task", "feature", "list"], synonyms: {} } },
  { question: "How do you define product success?", domain: "product", answer: "Product success is measured using metrics like user growth and satisfaction.", keywords: { must: ["success"], optional: ["metrics", "user", "growth"], synonyms: {} } },

  // ── UI/UX DESIGN ──────────────────────────────────────────────────────────
  { question: "What is UI and UX?", domain: "design", answer: "UI focuses on visual design while UX focuses on user experience and usability.", keywords: { must: ["ui", "ux"], optional: ["design", "experience", "usability"], synonyms: {} } },
  { question: "What is a wireframe?", domain: "design", answer: "A wireframe is a basic layout of a design showing structure and elements.", keywords: { must: ["wireframe"], optional: ["layout", "structure", "design"], synonyms: {} } },
  { question: "What is a prototype?", domain: "design", answer: "A prototype is an interactive model of a design used for testing.", keywords: { must: ["prototype"], optional: ["interactive", "model", "test"], synonyms: {} } },
  { question: "What is usability?", domain: "design", answer: "Usability measures how easy and efficient a product is to use.", keywords: { must: ["usability"], optional: ["easy", "efficient", "user"], synonyms: {} } },
  { question: "What is user journey?", domain: "design", answer: "User journey maps the steps a user takes while interacting with a product.", keywords: { must: ["user", "journey"], optional: ["steps", "interaction", "flow"], synonyms: {} } },
  { question: "What is design thinking?", domain: "design", answer: "Design thinking is a problem-solving approach focused on user needs.", keywords: { must: ["design", "thinking"], optional: ["problem", "user", "solution"], synonyms: {} } },
  { question: "What is accessibility?", domain: "design", answer: "Accessibility ensures products are usable by people with disabilities.", keywords: { must: ["accessibility"], optional: ["disability", "user", "inclusive"], synonyms: {} } },
  { question: "What is color theory?", domain: "design", answer: "Color theory studies how colors interact and affect design.", keywords: { must: ["color"], optional: ["design", "theory", "contrast"], synonyms: {} } },
  { question: "What is typography?", domain: "design", answer: "Typography is the style and arrangement of text in design.", keywords: { must: ["typography"], optional: ["text", "font", "design"], synonyms: {} } },
  { question: "What is responsive design in UI?", domain: "design", answer: "Responsive design adapts layouts for different screen sizes.", keywords: { must: ["responsive"], optional: ["screen", "layout", "adapt"], synonyms: {} } },
  { question: "What is Figma?", domain: "design", answer: "Figma is a design tool used for UI/UX design and collaboration.", keywords: { must: ["figma"], optional: ["design", "tool", "collaboration"], synonyms: {} } },
  { question: "What is consistency in design?", domain: "design", answer: "Consistency ensures uniform design elements across a product.", keywords: { must: ["consistency"], optional: ["design", "uniform", "elements"], synonyms: {} } },
  { question: "What is heuristic evaluation?", domain: "design", answer: "Heuristic evaluation is a usability inspection method using guidelines.", keywords: { must: ["heuristic"], optional: ["evaluation", "usability", "guidelines"], synonyms: {} } },
  { question: "What is user research?", domain: "design", answer: "User research involves understanding user needs and behavior.", keywords: { must: ["research"], optional: ["user", "behavior", "needs"], synonyms: {} } },
  { question: "What is feedback in UI?", domain: "design", answer: "Feedback informs users about actions and system responses.", keywords: { must: ["feedback"], optional: ["user", "response", "system"], synonyms: {} } },

  // ── QA/TESTING ────────────────────────────────────────────────────────────
  { question: "What is software testing?", domain: "qa", answer: "Software testing checks if a system works correctly and meets requirements.", keywords: { must: ["testing"], optional: ["software", "check", "requirement"], synonyms: {} } },
  { question: "Manual vs automation testing?", domain: "qa", answer: "Manual testing is done by humans, automation uses tools and scripts.", keywords: { must: ["manual", "automation"], optional: ["testing", "tools", "script"], synonyms: {} } },
  { question: "What is a test case?", domain: "qa", answer: "A test case defines steps and expected results for testing.", keywords: { must: ["test", "case"], optional: ["steps", "expected", "result"], synonyms: {} } },
  { question: "What is bug lifecycle?", domain: "qa", answer: "Bug lifecycle describes stages from detection to resolution.", keywords: { must: ["bug"], optional: ["lifecycle", "stages", "fix"], synonyms: {} } },
  { question: "What is regression testing?", domain: "qa", answer: "Regression testing ensures existing features work after changes.", keywords: { must: ["regression"], optional: ["testing", "change", "feature"], synonyms: {} } },
  { question: "What is unit testing?", domain: "qa", answer: "Unit testing tests individual components of code.", keywords: { must: ["unit"], optional: ["test", "component", "code"], synonyms: {} } },
  { question: "What is integration testing?", domain: "qa", answer: "Integration testing checks interaction between modules.", keywords: { must: ["integration"], optional: ["module", "interaction", "test"], synonyms: {} } },
  { question: "What is system testing?", domain: "qa", answer: "System testing evaluates the complete system.", keywords: { must: ["system"], optional: ["testing", "complete"], synonyms: {} } },
  { question: "What is UAT?", domain: "qa", answer: "UAT is user acceptance testing done by end users.", keywords: { must: ["uat"], optional: ["user", "acceptance", "testing"], synonyms: {} } },
  { question: "What is smoke testing?", domain: "qa", answer: "Smoke testing checks basic functionality of an application.", keywords: { must: ["smoke"], optional: ["test", "basic", "function"], synonyms: {} } },
  { question: "What is performance testing?", domain: "qa", answer: "Performance testing measures system speed and stability.", keywords: { must: ["performance"], optional: ["speed", "test", "stability"], synonyms: {} } },
  { question: "What is Selenium?", domain: "qa", answer: "Selenium is a tool for automating web testing.", keywords: { must: ["selenium"], optional: ["automation", "test", "web"], synonyms: {} } },
  { question: "What is a test plan?", domain: "qa", answer: "A test plan outlines testing strategy and scope.", keywords: { must: ["test", "plan"], optional: ["strategy", "scope"], synonyms: {} } },
  { question: "What is defect tracking?", domain: "qa", answer: "Defect tracking monitors bugs and issues during testing.", keywords: { must: ["defect"], optional: ["tracking", "bug", "issue"], synonyms: {} } },
  { question: "What is black box vs white box testing?", domain: "qa", answer: "Black box tests functionality, white box tests internal code.", keywords: { must: ["black", "white"], optional: ["testing", "code", "functionality"], synonyms: {} } },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: 'PrepHire' });
  const col = mongoose.connection.collection('questions');
  await col.deleteMany({});
  await col.insertMany(questions);
  console.log(`✅ Seeded ${questions.length} questions into PrepHire.questions`);

  // Print domain breakdown
  const domains = {};
  questions.forEach(q => { domains[q.domain] = (domains[q.domain] || 0) + 1; });
  console.log('Domain breakdown:', domains);

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌ Seed failed:', err.message); process.exit(1); });
