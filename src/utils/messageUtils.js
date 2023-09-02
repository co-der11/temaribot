import { channelID } from "./constants.js";

export const forwardMsg = async (ctx) => {
  const channel = await ctx.api.getChat(channelID);
  ctx.api.forwardMessage(ctx.chat.id, channel.id, 19);
};

export const welcomeMessage = (ctx) => {
  ctx.reply(
    "Welcome to Temari helper bot.\n Please join our channel before doing any task ",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Temari Helper Channel",

              url: "https://t.me/+kccwt2Ybpa01NGY8",
            },
          ],
        ],
      },
    }
  );
};

export const confirmPostMessage = (ctx) => {
  ctx.reply("Are you sure you want to post your question", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Confirm Post ✅",
            callback_data: "confirm_post",
          },
        ],
        [
          {
            text: "Cancel Post🚫",
            callback_data: "cancel_post",
          },
        ],
      ],
    },
  });
};
