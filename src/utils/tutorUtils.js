import Tutor from "../models/Tutor.js";
import { privateChannelId, resetState } from "./constants.js";
import { paginate } from "./constants.js";
export const createTutor = async (ctx) => {
  const {
    firstName,
    lastName,
    availableOnline,
    schedule,
    experience,
    tutorAge,
    cvId,
    educationLevel,
    city,
  } = ctx.session;
  ctx.reply("Creating your account");
  const exists = await Tutor.findOne({ tgId: ctx.chat.id });
  if (exists) {
    ctx.reply(`Dear ${firstName}, you are already registered as a Tutor.`);
  } else {
    const newTutor = new Tutor({
      name: `${firstName} ${lastName}`,
      experience,
      availableOnline,
      schedule,
      cvId,
      educationLevel,
      city,
      age: tutorAge,
      tgId: ctx.chat.id,
      dateCreated: Date.now(),
    });
    try {
      await newTutor.save();
      ctx.reply("You are successfuly registered as Tutor.");
      ctx.reply("We will notify you when admins verify you!");
    } catch (error) {
      ctx.reply(error.message);
    }
    resetState(ctx);
  }
};

export const fetchTutors = async (ctx) => {
  const results = await paginate(Tutor, ctx.session.page, ctx);
  await results.result.forEach(async (x) => {
    await ctx.reply(
      `
Name: <b>${x.name}</b>
Age : <b>${x.age} </b>
City : <b>${x.city} </b>
Education : <b>${x.educationLevel} </b>
Available online : <b>${x.availableOnline ? "Yes" : "No"} </b>
Rating : <b>${x.rating ? x.rating : "N/A"} </b>
    `,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Hire",
                callback_data: `hire ${x.id}`,
              },
            ],
          ],
        },
      }
    );
  });

  return results;
};

export const uploadCv = async (ctx) => {
  const post = await ctx.api.copyMessage(
    privateChannelId,
    ctx.chat.id,
    ctx.message.message_id,
    {
      caption: `${ctx.session.firstName}'s CV`,
    }
  );
  return post.message_id;
};

export const fetcCv = async (ctx, cvId) => {};
