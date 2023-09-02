import User from "../models/User.js";
import { adminId, channelID } from "./constants.js";
export const createUser = async (ctx, user) => {
  const newUser = new User({
    tgId: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    grade: user.grade,
    dateCreated: Date.now(),
  });

  try {
    const saved = await newUser.save({ wtimeout: 15000 });
    ctx.session.dbId = newUser.id;

    ctx.reply(
      "You have been registered succesfully✨✨✨ \nNow you can use our bot for free!! \nEnjoy and Learn Together⚡️⚡️"
    );
  } catch (error) {
    ctx.reply("Sorry", error.message);
  }
};

export const authUserMiddleware = async (ctx, next) => {
  const userExists = await User.findOne({ tgId: ctx.chat.id });
  if (ctx.session.dbId || ctx.session.task == "register") {
    next();
  } else if (userExists) {
    ctx.session.dbId = userExists.id;
    ctx.session.firstName = userExists.firstName;
    ctx.session.lastName = userExists.lastName;
    ctx.session.grade = userExists.grade;

    next();
  } else {
    ctx.session.task = "register";
    ctx.reply(
      "Welome to our bot. Start by registering to our bot \n send /register "
    );
  }
};

export const isMember = async (ctx, next) => {
  if (ctx.chat.type === "channel") {
    return;
  }
  const channel = await ctx.api.getChat(channelID);
  if (ctx.chat.id == adminId) {
    ctx.session.userRole = "admin";
  }
  const member = await ctx.api.getChatMember(channel.id, ctx.chat.id);
  const { status } = await member;
  if (status == "member" || status == "creator" || status == "administrator") {
    next();
  } else {
    ctx.reply("Please join our channel to get access to our services", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Temari Helper Channel",
              url: "https://t.me/temarihelper",
            },
          ],
        ],
      },
    });
  }
};
