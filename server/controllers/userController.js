import User from '../models/User.js';
import Review from '../models/Review.js';
import { parseResumeText } from '../services/aiMatchingService.js';

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.email;
    delete updates.role;

    if (req.body.resumeText) {
      const parsed = parseResumeText(req.body.resumeText);
      updates.skills = [...new Set([...(updates.skills || []), ...parsed.skills])];
      if (!updates.bio) updates.bio = parsed.summary;
      delete updates.resumeText;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getFreelancers(req, res) {
  try {
    const { search, featured, role } = req.query;
    const filter = { role: role || 'freelancer', status: 'active' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let query = User.find(filter).select('-password');

    if (featured === 'true') {
      query = query.sort({ rating: -1, totalReviews: -1 }).limit(12);
    } else {
      query = query.limit(50).sort({ rating: -1 });
    }

    const users = await query;
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateAvailability(req, res) {
  try {
    const userId = req.params.id;
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own availability' });
    }

    const { status, timezone, hoursPerWeek } = req.body;
    const validStatuses = ['full-time', 'part-time', 'not-available'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }

    const availability = {
      ...(req.user.availability?.toObject?.() || req.user.availability || {}),
    };
    if (status) {
      availability.status = status;
      availability.available = status !== 'not-available';
    }
    if (timezone !== undefined) availability.timezone = timezone;
    if (hoursPerWeek !== undefined) availability.hoursPerWeek = hoursPerWeek;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getUserReviews(req, res) {
  try {
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 });
    const mapped = reviews.map((r) => ({
      id: r._id,
      client: r.reviewer?.name || 'Client',
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
