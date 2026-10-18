import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import NewLawyer from '../models/NewLawyer.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // First try to find a User
    let account = await User.findById(decoded.id).select('-password');
    
    // If not a user, try to find a NewLawyer
    if (!account) {
      account = await NewLawyer.findById(decoded.id).select('-password');
    }
    
    if (!account) {
      return next(new Error('Account not found'));
    }
    
    socket.userId = account._id.toString();
    socket.user = account; // works for both User and NewLawyer
    
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};