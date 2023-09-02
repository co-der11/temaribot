import Answer from "../models/Answer.js";
import Question from "../models/Question.js";
import { channelID, botId } from "./constants.js";

import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;
export const postAnswer = async (ctx) => {
  const { answer, anonymousMode, questionId, dbId } = ctx.session;
  const question = await Question.findOne({ tgId: questionId });
  const newAnswer = new Answer({
    text: answer,
    answeredBy: new ObjectId(dbId),
    isAnonymous: anonymousMode,
    dateCreated: Date.now(),
    question: new ObjectId(question.id),
  });

  await newAnswer.save();
  ctx.reply("Answer posted");

  ctx.session.task = null;
  ctx.session.answer = null;
  ctx.session.anonymousMode = null;
  ctx.session.questionId = null;
};

export const fetchAnswers = async (ctx, messageId) => {
  const question = await Question.findOne({ tgId: messageId });
  const answers = await Answer.find({ question: question.id }).populate(
    "answeredBy"
  );
  await ctx.reply(` #${question.category} \n\n\n ${question.text} `);
  if (answers.length > 0) {
    answers.map((a) => {
      ctx.reply(
        `By:${
          a.isAnonymous
            ? "Anonymous user"
            : `<a href='tg://user?id=${a.answeredBy.tgId} ' >${a.answeredBy.firstName}</a>`
        } \n\n\n${a.text}`,
        { parse_mode: "HTML" }
      );
    });
  } else {
    ctx.reply("Sorry, There is no anwer posted to this question");
  }
};
