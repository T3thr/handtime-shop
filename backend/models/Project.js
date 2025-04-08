import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled Project'
  },
  scenes: [{
    id: String,
    background: String,
    character: String,
    dialogue: String,
    characterName: String,
    effects: [String],
    audio: String
  }],
  assets: {
    backgrounds: [{
      id: String,
      url: String,
      name: String,
      type: String
    }],
    characters: [{
      id: String,
      url: String,
      name: String,
      type: String
    }],
    music: [{
      id: String,
      url: String,
      name: String,
      type: String
    }],
    sfx: [{
      id: String,
      url: String,
      name: String,
      type: String
    }],
    effects: [{
      id: String,
      url: String,
      name: String,
      type: String
    }]
  },
  editorState: {
    background: {
      posX: Number,
      posY: Number,
      width: Number,
      height: Number,
      rotation: Number,
      opacity: Number,
      scale: Number
    },
    character: {
      posX: Number,
      posY: Number,
      width: Number,
      height: Number,
      rotation: Number,
      opacity: Number,
      scale: Number,
      emotion: String
    },
    text: {
      frameSize: Number,
      fontSize: Number,
      opacity: Number,
      color: String,
      position: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);