import mongoose from 'mongoose';

export function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid ID format: ${paramName}` });
    }
    return next();
  };
}
