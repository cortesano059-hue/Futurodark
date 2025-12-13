class Command {
  constructor({ name, description = '', category = 'general', permissions = [], options = [], execute }) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.permissions = permissions;
    this.options = options;
    this.execute = execute;
  }
}
module.exports = Command;
