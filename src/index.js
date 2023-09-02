import { Bot, session, webhookCallback } from "grammy";
import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import User from "./models/User.js";

import {
  gradeKeyboard,
  initialState,
  commands,
  subjectKeyboard,
  subjects,
  materialTypesKeyboard,
  types,
  resetState,
  browseTutors,
  aboutUs,
  adminId,
  channelID,
  paginate,
  privateChannelId,
} from "./utils/constants.js";
import {
  postQuestion,
  confirmPost,
  extractParams,
} from "./utils/questionUtils.js";
import { createUser, isMember, authUserMiddleware } from "./utils/userUtils.js";
import { confirmPostMessage } from "./utils/messageUtils.js";
import { fetchAnswers, postAnswer } from "./utils/answerUtils.js";
import { fetchMaterials, postMaterial } from "./utils/materialUtils.js";
import { createTutor, uploadCv } from "./utils/tutorUtils.js";
import Tutor from "./models/Tutor.js";
import TutorRequest from "./models/TutorRequest.js";
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB", err));

bot.api.setMyCommands(commands);
// middlewares
bot.use(session({ initial: initialState }));
bot.use(isMember);
bot.use(authUserMiddleware);
// commands
bot.command("start", async (ctx) => {
  ctx.session.page = 1;
  const params = extractParams(ctx.match);
  if (params.task == "answer") {
    ctx.session.task = "answer";
    ctx.session.questionId = params.messageId;
    ctx.reply("Please enter your asnwer to the question");
  } else if (params.task == "browse") {
    ctx.session.task == "browse";

    fetchAnswers(ctx, params.messageId);
  } else {
    ctx.reply("Welcome back sir. \nHow can help you today?");
    console.log(ctx.session);
  }
});

bot.command("admin_help", (ctx) => {
  ctx.reply(`
Here are admin commands

/admin_help - this message

/check_requests - check if there is anyone looking for a tutor

/verify_tutors - Verify people who applied for tutor position
`);
});
bot.command("about", async (ctx) => {
  const admin = await ctx.api.getChat(channelID);
  aboutUs(ctx);
});
bot.command("reset", (ctx) => {
  resetState(ctx);
  ctx.reply(
    "Your session task was restored.\n To check what I am capable of send /help "
  );
});

bot.command("help", (ctx) => {
  ctx.reply(` 
Here are commands for the bot

/start - initialize the bot

/register - create an account 

/ask - post a question to our channel

/hire_tutor - choose and hire a tutor



`);
});

bot.command("ask", (ctx) => {
  ctx.reply("Please give me your question");
  ctx.session.task = "ask";
});

bot.on(":document", async (ctx) => {
  const { task, materialName, materialCategory, materialType } = ctx.session;
  if (task == "postMaterial") {
    if (materialName && materialCategory && materialType) {
      postMaterial(ctx);
    } else {
      ctx.reply("Please give us all required data to post a material ");
    }
  } else if (task == "beTutor") {
    const cvId = await uploadCv(ctx);
    ctx.session.cvId = cvId;
    confirmPost(ctx);
  } else {
    ctx.reply(
      "Why did you sent a file.\n If you wanna share a material, use /materials"
    );
  }
});

bot.command("register", async (ctx) => {
  const userExists = await User.findOne({ tgId: ctx.chat.id });
  if (ctx.session.dbId) {
    return ctx.reply("You are already registered");
  } else if (userExists) {
    ctx.session.dbId = userExists.id;
    ctx.session.firstName = userExists.firstName;
    ctx.session.lastName = userExists.lastName;
    ctx.reply(" You are successfully authenticated. Enjoy and Learn! ");
  } else {
    ctx.session.task = "register";
    ctx.reply("send your first name");
  }
});

bot.command("materials", (ctx) => {
  ctx.reply("Choose please", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Get Materials",
            callback_data: "get_materials",
          },
        ],
        [
          {
            text: "Post Materials",
            callback_data: "post_material",
          },
        ],
      ],
    },
  });
});

// Question Post Stuff
bot.callbackQuery("confirm_post", async (ctx) => {
  ctx.deleteMessage();
  const { task } = ctx.session;
  if (task == "ask") {
    await postQuestion(ctx);
    ctx.reply("question posted ✅");
  }
  if (task == "answer") {
    await postAnswer(ctx);
  }
  if (task == "beTutor") {
    await createTutor(ctx);
  }
});

bot.callbackQuery("cancel_post", (ctx) => {
  ctx.deleteMessage();
  resetState(ctx);
  ctx.reply("question canceled ⛔️. \n send /ask to ask a question");
});

bot.command("be_tutor", (ctx) => {
  ctx.session.task = "beTutor";
  ctx.reply("We have your name. How old are you?");
});
bot.command("hire_tutor", async (ctx) => {
  browseTutors(ctx, 1);
});

bot.command("check_requests", async (ctx) => {
  if (ctx.session.userRole != "admin") {
    return ctx.reply("You are not authorized to do this");
  }
  const requests = await TutorRequest.find({ isPending: true })
    .populate("user")
    .populate("tutorId");
  requests.forEach((r) => {
    ctx.reply(
      ` ${r.user.firstName} wants to be tutors by ${r.tutorId.name}\n DM here <a href='tg://user?id=${r.user.tgId}' > ${r.user.firstName} </a> \n after chatting comeback and click that DONE button`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Done",
                callback_data: `request_done ${r.id}`,
              },
            ],
          ],
        },
      }
    );
  });
});

bot.command("verify_tutors", async (ctx) => {
  if (ctx.session.userRole != "admin") {
    return ctx.reply("You are not authorized to do this");
  }
  const unverifiedTutors = await Tutor.find({ verified: false });

  async function processTutor(index) {
    if (index < unverifiedTutors.length) {
      const tutor = unverifiedTutors[index];

      await ctx.reply(
        `
        Name: <b>${tutor.name}</b>
        Age : <b>${tutor.age} </b>
        City : <b>${tutor.city} </b>
        Education : <b>${tutor.educationLevel} </b>
        Available online : <b>${tutor.availableOnline ? "Yes" : "No"} </b>
        Rating : <b>${tutor.rating ? tutor.rating : "N/A"} </b>
        Telegram : <a href='tg://user?id=${tutor.tgId}'>${tutor.name}</a>
        `,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Verify ✅",
                  callback_data: `verify ${tutor.id}`,
                },
              ],
            ],
          },
        }
      );
      ctx.api.copyMessage(ctx.chat.id, privateChannelId, tutor.cvId, {
        caption: `${tutor.name}'s CV`,
      });
      setTimeout(() => {
        processTutor(index + 1);
      }, 1000); // Delay of 2000 milliseconds (2 seconds)
    }
  }

  processTutor(0);
});
bot.callbackQuery("prev_page", (ctx) => {
  ctx.deleteMessage();
  const currentPage = ctx.session.page;
  browseTutors(ctx, currentPage - 1);
});
bot.callbackQuery("next_page", (ctx) => {
  ctx.deleteMessage();
  const currentPage = ctx.session.page;
  browseTutors(ctx, currentPage + 1);
});

bot.on("callback_query", async (ctx) => {
  ctx.deleteMessage();
  const { task } = ctx.session;
  const { data } = ctx.callbackQuery;

  // Anonymous mode on
  if (data == "anonymous_yes") {
    ctx.session.anonymousMode = true;
    confirmPostMessage(ctx);

    // Anonymous mode off
  } else if (data == "anonymous_no") {
    ctx.session.anonymousMode = false;
    confirmPostMessage(ctx);

    // Get materials button
  } else if (data == "get_materials") {
    ctx.session.task = "getMaterials";
    ctx.reply("tell me the subject of the material", {
      reply_markup: {
        inline_keyboard: subjectKeyboard,
      },
    });
  } else if (data == "post_material") {
    ctx.session.task = "postMaterial";
    ctx.reply("Please give me a descriptive name to the material");

    // Subjects Button
  } else if (subjects.filter((x) => x == data).length > 0) {
    ctx.session.materialCategory = data;
    ctx.reply("What kind of material do you want?", {
      reply_markup: {
        inline_keyboard: materialTypesKeyboard,
      },
    });
  } else if (types.filter((x) => x == data).length > 0) {
    ctx.session.materialType = data;
    fetchMaterials(ctx);
  } else if (data == "online_yes") {
    ctx.session.availableOnline = true;
    ctx.reply("Finally, Please upload your CV (preferable in PDF format)");
  } else if (data == "online_no") {
    ctx.session.availableOnline = false;
    ctx.reply("Finally, Please upload your CV (preferable in PDF format)");
  } else if (data.split(" ")[0] == "hire") {
    const tutorId = data.split(" ")[1];
    ctx.session.task = "hireTutor";
    ctx.session.tutorId = tutorId;
    ctx.reply(
      `Please reach out to <a href='tg://user?id=${adminId}' >Yimam</a> for further instructions.\n If you are in spam restriction,  <a href='tg://user?id=${adminId}'>Yimam</a> will contact you`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "I will contact the admin",
                callback_data: "contact_admin",
              },
            ],
            [
              {
                text: "I am in spam",
                callback_data: "contact_client",
              },
            ],
          ],
        },
      }
    );
  } else if (data == "contact_admin") {
    const tutor = await Tutor.findOne({ _id: ctx.session.tutorId });
    ctx.reply(
      `contact  <a href='tg://user?id=${adminId}' >yimam</a>\n Just make sure to mention the tutor's name \n Tutor's Name: <b> ${tutor.name}</b> `,
      { parse_mode: "HTML" }
    );
  } else if (data.split(" ")[0] == "verify") {
    const tutorId = data.split(" ")[1];
    const tutor = await Tutor.findOne({ _id: tutorId });
    tutor.verified = true;
    await tutor.save();

    ctx.reply(
      `Veified <a href="tg://user?id=${tutor.tgId} " >${tutor.name}</a> `,
      { parse_mode: "HTML" }
    );
  } else if (data == "contact_client") {
    const tutor = await Tutor.findOne({ _id: ctx.session.tutorId });
    const newTutorRequest = new TutorRequest({
      user: new mongoose.Types.ObjectId(ctx.session.dbId),
      tutorId: new mongoose.Types.ObjectId(tutor.id),
    });
    await newTutorRequest.save();
    ctx.reply(
      "The request was sent. Admin will contact you in a couple of hours"
    );
    ctx.api.sendMessage(
      adminId,
      "A new user has requested a tuter\n send /check_requests to see "
    );
  } else if (data.split(" ")[0] == "request_done") {
    const requestId = data.split(" ")[1];
    const tutorRequest = await TutorRequest.findOne({ _id: requestId });
    tutorRequest.isPending = false;
    await tutorRequest.save();
    ctx.reply("Request closed successfuly");
  } else {
    console.log("NOTHING");
  }
});
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const {
    task,
    question,
    questionCategory,
    firstName,
    lastName,
    answer,
    materialName,
    materialCategory,
    materialType,
    availableOnline,
    schedule,
    experience,
    tutorAge,
    educationLevel,
    city,
  } = ctx.session;
  if (task == "ask") {
    if (question) {
      if (!questionCategory) {
        ctx.session.questionCategory = text;
        ctx.reply(
          "Do you want to ask anonymously \n If you select 'No', your profile id will be attached to the question! ",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Yes",
                    callback_data: "anonymous_yes",
                  },
                  {
                    text: "No",
                    callback_data: "anonymous_no",
                  },
                ],
              ],
            },
          }
        );
      }
    } else {
      ctx.session.question = text;
      ctx.reply("What the subject matter of the question?", {
        reply_markup: {
          keyboard: [
            ["Math", "Physics", "Chemistery"],
            ["Biology", "History", "Civic"],
            ["English", "Amharic"],
          ],
        },
      });
    }
  } else if (task == "register") {
    if (firstName) {
      if (lastName) {
        if (text == "University") {
        } else {
          if (
            /[a-zA-Z]/.test(text) ||
            parseInt(text) > 12 ||
            parseInt(text) < 1
          ) {
            ctx.reply("Please use the buttons to enter your grade");
          } else {
            ctx.session.grade = parseInt(text);
            const user = {
              id: ctx.chat.id,
              username: ctx.chat.username,
              firstName: firstName,
              lastName: lastName,
              grade: parseInt(text),
            };
            await createUser(ctx, user);
          }
        }
      } else {
        ctx.session.lastName = text;
        ctx.reply("What grade are you in.", {
          reply_markup: gradeKeyboard,
        });
      }
    } else {
      ctx.session.firstName = text;
      ctx.reply("your last name please?");
    }
  } else if (task == "answer") {
    if (!answer) {
      ctx.session.answer = text;
      ctx.reply("Do want to answer anonymously?", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Yes",
                callback_data: "anonymous_yes",
              },
              {
                text: "No",
                callback_data: "anonymous_no",
              },
            ],
          ],
        },
      });
    }
    // post material
  } else if (task == "postMaterial") {
    if (materialName) {
      if (materialCategory) {
        if (!materialType) {
          ctx.session.materialType = text;
          ctx.reply("Finally, send me the material file");
        }
      } else {
        ctx.session.materialCategory = text;
        ctx.reply("Now please select the type of the material", {
          reply_markup: {
            keyboard: [
              ["Note", "Presentationn", "Project"],
              ["Exam", "Worksheet", "Media"],
            ],
          },
        });
      }
    } else {
      ctx.session.materialName = text;
      ctx.reply("Now please select the subject of the material", {
        reply_markup: {
          keyboard: [
            ["Math", "Physics", "Chemistery"],
            ["Biology", "History", "Civic"],
            ["English", "Amharic"],
          ],
        },
      });
    }
  } else if (task == "beTutor") {
    if (tutorAge) {
      if (experience) {
        if (schedule) {
          if (educationLevel) {
            if (!city) {
              ctx.session.city = text;
              ctx.reply("Are you available online", {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "Yes",
                        callback_data: "online_yes",
                      },
                      {
                        text: "No",
                        callback_data: "online_no",
                      },
                    ],
                  ],
                },
              });
            }
          } else {
            ctx.session.educationLevel = text;
            ctx.reply("Where do you live at. Just tell me your City...");
          }
        } else {
          ctx.session.schedule = text;
          ctx.reply(
            "Tell me your education level in simple words \n ex: 'Master in Accounting'"
          );
        }
      } else {
        if (isNaN(text)) {
          return ctx.reply(
            "Please enter a number. Do not include any letter or Special character "
          );
        } else {
          ctx.session.experience = parseInt(text);
          ctx.reply("Please tell me your schedule with your own words");
        }
      }
    } else {
      if (isNaN(text)) {
        return ctx.reply(
          "Please enter a number. Do not include any letter or Special character "
        );
      } else {
        ctx.session.tutorAge = parseInt(text);
        ctx.reply(
          "How many years of experience do you have? (enter only number)"
        );
      }
    }
  } else {
    ctx.reply(
      "Why did you send the text? I am not a chat bot \n To see what I am capable of  send /help "
    );
  }
});

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
