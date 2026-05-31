import User from '../models/User.js';
import Review from '../models/Review.js';
import { parseResumeText, parseAndEnrichResume } from '../services/aiMatchingService.js';
import { extractTextFromFile } from '../services/resumeExtractorService.js';

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

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (updates.freelancerProfile && user.role === 'freelancer') {
      user.freelancerProfile = { ...user.freelancerProfile?.toObject?.(), ...updates.freelancerProfile };
      if (updates.freelancerProfile.skills) user.skills = updates.freelancerProfile.skills;
      if (updates.freelancerProfile.hourlyRate != null) user.hourlyRate = updates.freelancerProfile.hourlyRate;
      if (updates.freelancerProfile.bio) user.bio = updates.freelancerProfile.bio;
      if (updates.freelancerProfile.portfolio) user.portfolio = updates.freelancerProfile.portfolio;
      delete updates.freelancerProfile;
    }

    if (updates.clientProfile && user.role === 'client') {
      user.clientProfile = { ...user.clientProfile?.toObject?.(), ...updates.clientProfile };
      if (updates.clientProfile.companyName) user.title = updates.clientProfile.companyName;
      if (updates.clientProfile.description) user.bio = updates.clientProfile.description;
      delete updates.clientProfile;
    }

    Object.assign(user, updates);
    user.syncRoleProfile();
    await user.save();

    const saved = await User.findById(user._id).select('-password');
    return res.json(saved);
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

// Upload resume file, extract text, run AI parser, store results
export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Extract text from the uploaded file
    const resumeText = await extractTextFromFile(req.file.path);

    // Run AI enrichment pipeline
    const { skills, experienceKeywords, bio } = parseAndEnrichResume(resumeText);

    // Persist file path, extracted text, and AI suggestions
    user.resumeUrl = req.file.path;
    user.resumeText = resumeText;
    user.aiSuggestions = {
      skills,
      bio,
      experienceKeywords,
      generatedAt: new Date(),
    };

    await user.save();

    const saved = await User.findById(user._id).select('-password');
    return res.json({
      message: 'Resume uploaded and parsed successfully',
      resumeUrl: user.resumeUrl,
      aiSuggestions: user.aiSuggestions,
      user: saved,
    });
  } catch (err) {
    console.error('uploadResume error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// Return stored AI suggestions for the logged-in user
export async function getAiSuggestions(req, res) {
  try {
    const user = await User.findById(req.user._id).select('aiSuggestions resumeUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.aiSuggestions || {});
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Apply or reject AI suggestions — user decides which fields to accept
export async function applyAiSuggestions(req, res) {
  try {
    const { acceptSkills, acceptBio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.aiSuggestions?.generatedAt) {
      return res.status(400).json({ message: 'No AI suggestions available. Upload a resume first.' });
    }

    if (acceptSkills === true && user.aiSuggestions.skills?.length) {
      const merged = [...new Set([...(user.skills || []), ...user.aiSuggestions.skills])];
      user.skills = merged;
      if (!user.freelancerProfile) user.freelancerProfile = {};
      user.freelancerProfile.skills = merged;
    }

    if (acceptBio === true && user.aiSuggestions.bio) {
      user.bio = user.aiSuggestions.bio;
      if (!user.freelancerProfile) user.freelancerProfile = {};
      user.freelancerProfile.bio = user.aiSuggestions.bio;
    }

    user.syncRoleProfile();
    await user.save();

    const saved = await User.findById(user._id).select('-password');
    return res.json({ message: 'AI suggestions applied', user: saved });
  } catch (err) {
    console.error('applyAiSuggestions error:', err);
    return res.status(500).json({ message: err.message });
  }
}
