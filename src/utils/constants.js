import dotenv from "dotenv";
import { fetchTutors } from "./tutorUtils.js";
dotenv.config();

export const channelID = process.env.CHANNEL_ID;
export const botId = process.env.BOT_ID;
export const privateChannelId = process.env.PRIVATE_CHANNEL_ID;
export const adminId = process.env.BOT_OWNER;
export const initialState = () => ({
  task: null,
  question: null,
  answer: null,
  questionCategory: null,
  anonymousMode: null,
  questionId: null,
  materialName: null,
  materialCategory: null,
  materialType: null,
  firstName: null,
  lastName: null,
  grade: null,
  dbId: null,
});

export const commands = [
  { command: "start", description: "Start the bot" },
  { command: "reset", description: "restore your current session task " },
  { command: "register", description: "Sign Up to our bot" },
  { command: "ask", description: "post question to our channel" },
  { command: "materials", description: "Get learning materials" },
  { command: "hire_tutor", description: "Hire a tutor" },
  { command: "help", description: "Get help with the bot" },
  { command: "about", description: "Learn more about the bot" },
];

export const gradeKeyboard = {
  keyboard: [
    ["1", "2", "3", "4"],
    ["5", "6", "7", "8"],
    ["9", "10", "11", "12"],
    ["University"],
  ],
};

export const subjects = [
  "Biology",
  "Chemistery",
  "Math",
  "Physics",
  "English",
  "Civic",
  "History",
];

export const types = [
  "Note",
  "Presentation",
  "Project",
  "Exam",
  "Worksheet",
  "Media",
];
export const subjectKeyboard = [
  [
    {
      text: "Biology 🦣☘️",
      callback_data: "Biology",
    },
    {
      text: "Chemistery 🧪",
      callback_data: "Chemistery",
    },
  ],
  [
    {
      text: "Math ➕✖️",
      callback_data: "Math",
    },
    {
      text: "Physics 🧲",
      callback_data: "Physics",
    },
  ],
  [
    {
      text: "English 🇬🇧",
      callback_data: "English",
    },
    {
      text: "Amharic 🇪🇹",
      callback_data: "Amharic",
    },
  ],
  [
    {
      text: "Civic ⚖️",
      callback_data: "Civic",
    },
    {
      text: "History📜",
      callback_data: "History",
    },
  ],
];

export const materialTypesKeyboard = [
  [
    {
      text: "Note",
      callback_data: "Note",
    },
    {
      text: "Presentation",
      callback_data: "Presentation",
    },
  ],
  [
    {
      text: "Exam",
      callback_data: "Exam",
    },
    {
      text: "Worksheet",
      callback_data: "Worksheet",
    },
  ],
  [
    {
      text: "Project",
      callback_data: "Project",
    },
    {
      text: "Media",
      callback_data: "Media",
    },
  ],
];

export const terms = (ctx) => {
  ctx.reply(
    `
Welcome to <b>Beir Tutorials.</b>
Thanks for applying for the position of tutoring.
Meanwhile, you must read and agree with our terms of services of our company.

#1 You <b>must</b> provide detailed information about your experience in Tutoring.

#2 You <b>must</b> participate in answering questions asked by users.

#3 You <b>must</b> be a member of the support group and provide support on how to use our educational bot and other services.

#4 You <b>must</b> be responsible when we assign you to teach individuals with experience and confidence.

#5 Any other rules <b>must</b> be followed regularly.


Respecting the above rules helps you to get hired as a tutor.
Thanks,
The Team
`,
    {
      parse_mode: "HTML",
    }
  );
};

export const paginate = async (model, page, ctx) => {
  const limit = 2;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};

  const docCount = await model.countDocuments({ verified: true }).exec();
  if (endIndex < docCount) {
    results.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit,
    };
  }
  try {
    results.result = await model
      .find({ verified: true })
      .limit(limit)
      .skip(startIndex)
      .exec();
    return results;
  } catch (error) {
    ctx.reply(error.message);
  }
};

const navKeyboardButtons = async (ctx, prev, next) => {
  const navKeyboard = [];
  if (prev) {
    navKeyboard.push({ text: "<< Previous", callback_data: "prev_page" });
  }
  if (next) {
    navKeyboard.push({ text: "Next >>", callback_data: "next_page" });
  }
  await ctx.reply(`Page ${ctx.session.page}`, {
    reply_markup: {
      inline_keyboard: [navKeyboard],
    },
  });
};

export const browseTutors = async (ctx, page) => {
  ctx.session.page = page;
  const results = await fetchTutors(ctx);
  if (results.result.length) {
    await navKeyboardButtons(ctx, results.previous, results.next);
  }
};

export const resetState = (ctx) => {
  ctx.session.task = null;
  ctx.session.question = null;
  ctx.session.answer = null;
  ctx.session.questionCategory = null;
  ctx.session.anonymousMode = null;
  ctx.session.questionId = null;
  ctx.session.materialCategory = null;
  ctx.session.materialName = null;
  ctx.session.materialType = null;
  ctx.session.tutorAge = null;
  ctx.session.experience = null;
  ctx.session.schedule = null;
  ctx.session.availableOnline = null;
};

export const aboutUs = (ctx) => {
  ctx.reply(`
  
  Beir Tutorials is general educational service provider .
  In our company there are many Tutors with high experience and with a good character dedicated to help you and your child on your/their academic achievements .
  Our Goal☑️
  🔻Decrease the lack of information and skill among students all over the country by connecting them to share their knowledge together.
  
  🔻Make students self reliant and confident on their academic problems by providing enormous materials in order to help them
  
  🔺Make smooth relationship between teachers and students
  
  #OUR VISION
  
  🔻 Our vision is to  connect
  more than 5 Million students across the country
  
  ብዕር ለእርስዎ እና ለልጆችዎ ተብሎ የተዘጋጀ የትምህርት ፕሮጄክት ነው ።
  
  
  Contact us 
  
  Founder 
  @onlyone08
  
  developers
  @HenaCodes

`);
};
