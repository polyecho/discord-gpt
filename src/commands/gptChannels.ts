import {
    ChannelType,
    CommandInteractionOptionResolver,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

import { CommandFile } from "../types/registerTypes";
import * as prismaUtils from "../utils/prismaUtils";

const command: CommandFile = {
    data: new SlashCommandBuilder()
        .setName("gpt-channels")
        .setDescription("Manage GPT channels.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add this channel to the GPT channel list.")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove")
                .setDescription(
                    "Remove this channel from the GPT channel list."
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

    execute: async (interaction) => {
        // It shouldn't work in DMs.
        if (interaction.channel?.type === ChannelType.DM) {
            return await interaction.reply({
                content: "You cannot use this command in DM message! 🚫",
            });
        }
        if (!interaction.guildId) return;

        // Read subcommand name and required data.
        const subCommand = (
            interaction.options as CommandInteractionOptionResolver
        ).getSubcommand();
        let isAddingChannel: boolean;

        if (subCommand === "add") {
            isAddingChannel = true;
        } else {
            isAddingChannel = false;
        }

        if (isAddingChannel !== null) {
            await interaction.deferReply({ ephemeral: true });

            let isSuccessful = false;

            const existingChannel = await prismaUtils.channel.findFirst(
                interaction.channelId,
                interaction.guildId
            );

            if (!existingChannel) {
                const createdChannel = await prismaUtils.channel.create(
                    interaction.channelId,
                    interaction.guildId
                );

                if (createdChannel && createdChannel.guildId) {
                    await prismaUtils.channel.updateGptChannel(
                        createdChannel.id,
                        {
                            isGptChannel: true,
                        },
                        createdChannel.guildId
                    );
                }

                if (createdChannel) {
                    isSuccessful = true;
                }
            }

            const updatedChannel = await prismaUtils.channel.updateGptChannel(
                interaction.channelId,
                {
                    isGptChannel: isAddingChannel,
                },
                interaction.guildId
            );

            if (!updatedChannel) {
                return await interaction.editReply({
                    content: "Please try again later. 😢",
                });
            }

            isSuccessful = true;

            if (!isSuccessful) {
                return await interaction.editReply({
                    content: "Please try again later. 😢",
                });
            }

            if (!isAddingChannel) {
                return await interaction.editReply({
                    content: "This channel is no longer a GPT channel! 🤖",
                });
            }

            return await interaction.editReply({
                content: "This channel is now a GPT channel! 🤖",
            });
        }
    },
};

export default command;
