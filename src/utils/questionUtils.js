import Question from "../models/Question.js";
import { channelID, botId, terms } from "./constants.js";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
export const postQuestion = async (ctx) => {
  const channel = await ctx.api.getChat(channelID);
  const { question, questionCategory, anonymousMode } = ctx.session;
  if (!question | !questionCategory) {
    return ctx.reply(
      "All required must be filled to post question. \n try again /ask "
    );
  }
  const questionText = `
  #${questionCategory}
  By : ${
    anonymousMode
      ? "Anonymous user"
      : `<a href='tg://user?id=${ctx.chat.id}' >${ctx.session.firstName}</a>
  
  `
  }

  
  ${question}
  `;
  try {
    const post = await ctx.api.sendMessage(channel.id, questionText, {
      parse_mode: "HTML",
    });
    const newUrl = (task) => {
      return `https://t.me/${botId.substring(1)}?start=${btoa(
        `messageId=${post.message_id}&task=${task}`
      )}`.replace(/\s+/g, "");
    };

    // the new URL you want to set
    // update the message with the modified keyboard
    await ctx.api.editMessageReplyMarkup(channel.id, post.message_id, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Answer",
              url: newUrl("answer"),
            },
            {
              text: "Browse",
              url: newUrl("browse"),
            },
          ],
        ],
      },
    });
    const newQuestion = new Question({
      text: question,
      category: questionCategory,
      asker: new ObjectId(ctx.session.dbId),
      isAnonymous: anonymousMode,
      tgId: post.message_id,
    });

    await newQuestion.save();
  } catch (error) {
    ctx.reply(error.message);
  }

  ctx.session.task = null;
  ctx.session.question = null;
  ctx.session.questionCatergory = null;
  ctx.session.anonymousMode = null;
};

export const confirmPost = async (ctx) => {
  if (ctx.session.task == "beTutor") {
    terms(ctx);
  }
  await ctx.reply(`Confirm your task?  `, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Yes",
            callback_data: "confirm_post",
          },
          {
            text: "No",
            callback_data: "cancel_post",
          },
        ],
      ],
    },
  });
};

export const extractParams = (base64) => {
  let decoded = atob(base64);
  return Object.fromEntries(new URLSearchParams(decoded));
};
