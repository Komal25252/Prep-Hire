/**
 * Seed script — run once to populate the questions collection.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/seedQuestions.ts
 * Or add to package.json: "seed": "ts-node scripts/seedQuestions.ts"
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const MONGO_URI = process.env.MONGO_KEY as string;

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
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: 'PrepHire' });
  const col = mongoose.connection.collection('questions');

  // Clear existing and re-insert
  await col.deleteMany({});
  await col.insertMany(questions);
  console.log(`✅ Seeded ${questions.length} questions`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
