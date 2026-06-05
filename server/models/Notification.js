import mongoose from 'mongoose'; 
 const { Schema, model } = mongoose; 
 
 /** 
  * Notification model — stores persistent in-app notifications per user. 
  */ 
 const NotificationSchema = new Schema( 
   { 
     user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
     message: { type: String, required: true }, 
     type: { 
       type: String, 
       enum: ['message', 'proposal', 'contract', 'payment', 'interview', 'general'], 
       default: 'general', 
     }, 
     read: { type: Boolean, default: false }, 
     link: { type: String, default: '' }, 
   }, 
   { timestamps: true } 
 ); 
 
 export default model('Notification', NotificationSchema); 
