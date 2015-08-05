
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// create a schema
var taskSchema = new Schema({
  code: String,
  description: String,
  state: String,
  track: [{
    responsible: String,
    state: String,
    updated_at: Date
  }],
  created_at: Date
});

// the schema is useless so far
// we need to create a model using it
var Task = mongoose.model('Task', taskSchema);

// make this available to our users in our Node applications
module.exports = Task;
