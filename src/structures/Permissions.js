// src/structures/utils/Permissions.js

const { PermissionFlagsBits } = require('discord.js');

module.exports = class Permissions {
    constructor(client) {
        this.client = client;
    }

    /**
     * Verifica si un miembro tiene todos los permisos requeridos.
     * @param {import('discord.js').GuildMember} member
     * @param {string[]} requiredPermissions - Array de permisos (ej: ['KickMembers', 'BanMembers']).
     * @returns {boolean}
     */
    checkUser(member, requiredPermissions) {
        if (!member || !requiredPermissions || requiredPermissions.length === 0) return true;

        for (const perm of requiredPermissions) {
            // PermissionFlagsBits[perm] convierte el string ('KickMembers') al BigInt de Discord
            if (!member.permissions.has(PermissionFlagsBits[perm])) {
                return false;
            }
        }
        return true;
    }
}