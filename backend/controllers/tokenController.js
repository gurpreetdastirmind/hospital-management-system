const Token = require('../models/Token');
const Department = require('../models/Department');

const generateTokenNumber = async (department) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastToken = await Token.findOne({ 
    department, 
    createdAt: { $gte: today, $lt: tomorrow } 
  }).sort({ token_number: -1 });
  
  if (lastToken) {
    const parts = lastToken.token_number.split('-');
    const num = parseInt(parts[parts.length - 1]) + 1;
    const prefix = department.substring(0, 1).toUpperCase();
    return `${prefix}-${String(num).padStart(2, '0')}`;
  }
  const prefix = department.substring(0, 1).toUpperCase();
  return `${prefix}-01`;
};

const autoCallNextToken = async (department) => {
  const nextToken = await Token.findOne({ department, status: 'waiting' }).sort({ createdAt: 1 });
  if (nextToken) {
    nextToken.status = 'called';
    await nextToken.save();
    console.log(`🔄 Auto-called ${nextToken.token_number} for ${department}`);
    return nextToken;
  }
  return null;
};

const checkAndAutoComplete = async () => {
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
  const expiredTokens = await Token.find({ 
    status: 'called', 
    updatedAt: { $lt: twentyMinutesAgo } 
  });
  
  console.log(`⏰ Found ${expiredTokens.length} expired tokens`);
  for (const token of expiredTokens) {
    token.status = 'completed';
    await token.save();
    console.log(`✅ Auto-completed ${token.token_number}`);
    await autoCallNextToken(token.department);
  }
  return expiredTokens.length;
};

const generateToken = async (req, res, next) => {
  try {
    const { name, phoneNumber, age, department, source = 'App' } = req.body;
    if (!name || !phoneNumber || !department) {
      return res.status(400).json({ success: false, error: 'Name, phone and department required' });
    }

    const departmentInfo = await Department.findOne({ name: department });
    if (!departmentInfo) return res.status(404).json({ success: false, error: 'Department not found' });
    if (!departmentInfo.isOpen) return res.status(400).json({ success: false, error: 'Department is currently closed' });

    const tokenNumber = await generateTokenNumber(department);
    const roomNumber = departmentInfo.room || `Room ${Math.floor(Math.random() * 20) + 1}`;

    const newToken = new Token({
      token_number: tokenNumber, patient_name: name, phone_number: phoneNumber,
      age: age || null, department, room_number: roomNumber, source
    });
    await newToken.save();

    const waitingCount = await Token.countDocuments({ department, status: 'waiting' });
    if (waitingCount === 1) {
      newToken.status = 'called';
      await newToken.save();
      return res.status(201).json({ success: true, message: 'Token generated and called', data: newToken });
    }

    res.status(201).json({ success: true, message: 'Token generated', data: newToken });
  } catch (error) { next(error); }
};

const getTokenByIdRoute = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    res.json({ success: true, data: token });
  } catch (error) { next(error); }
};

const getTokens = async (req, res, next) => {
  try {
    await checkAndAutoComplete(); // Trigger auto-complete on every read
    
    const { limit = 100, offset = 0, status, department, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const tokens = await Token.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(offset));
    const total = await Token.countDocuments(filter);

    res.json({ success: true, data: tokens, pagination: { limit: parseInt(limit), offset: parseInt(offset), total } });
  } catch (error) { next(error); }
};

const updateTokenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['waiting', 'called', 'completed', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const token = await Token.findById(id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });

    token.status = status;
    await token.save();

    if (status === 'completed') {
      await autoCallNextToken(token.department);
    }

    res.json({ success: true, message: 'Token status updated', data: token });
  } catch (error) { next(error); }
};

const getTokensByDepartment = async (req, res, next) => {
  try {
    const { department } = req.params;
    const { status = 'waiting,called' } = req.query;
    const statuses = status.split(',');
    
    const tokens = await Token.find({ department, status: { $in: statuses } }).sort({ createdAt: 1 });
    res.json({ success: true, data: tokens, count: tokens.length });
  } catch (error) { next(error); }
};

const updateToken = async (req, res, next) => {
  try {
    const token = await Token.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    res.json({ success: true, message: 'Token updated', data: token });
  } catch (error) { next(error); }
};

const getDailyStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [stats, deptStats] = await Promise.all([
      Token.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] } },
          called: { $sum: { $cond: [{ $eq: ['$status', 'called'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
          from_app: { $sum: { $cond: [{ $eq: ['$source', 'App'] }, 1, 0] } },
          from_counter: { $sum: { $cond: [{ $eq: ['$source', 'Counter'] }, 1, 0] } }
        }}
      ]),
      Token.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { 
          _id: '$department', 
          total: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] } },
          called: { $sum: { $cond: [{ $eq: ['$status', 'called'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }}
      ])
    ]);

    res.json({ success: true, data: { ...stats[0] || {}, department_breakdown: deptStats } });
  } catch (error) { next(error); }
};

const callNextToken = async (req, res, next) => {
  try {
    const { department } = req.body;
    if (!department) return res.status(400).json({ success: false, error: 'Department required' });

    const nextToken = await autoCallNextToken(department);
    if (nextToken) {
      res.json({ success: true, message: `Next token ${nextToken.token_number} called`, data: nextToken });
    } else {
      res.json({ success: true, message: `No waiting tokens for ${department}`, data: null });
    }
  } catch (error) { next(error); }
};

const getDepartmentStatus = async (req, res, next) => {
  try {
    const { department } = req.params;
    const currentCalled = await Token.findOne({ department, status: 'called' }).sort({ updatedAt: -1 });
    const waitingCount = await Token.countDocuments({ department, status: 'waiting' });
    const waitingTokens = await Token.find({ department, status: 'waiting' }).sort({ createdAt: 1 });
    
    const today = new Date(); today.setHours(0,0,0,0);
    const completedToday = await Token.countDocuments({ 
      department, status: 'completed', createdAt: { $gte: today } 
    });

    res.json({ success: true, data: { department, currentCalled, waitingCount, waitingTokens, completedToday } });
  } catch (error) { next(error); }
};

module.exports = { 
  generateToken, getTokens, getTokenById: getTokenByIdRoute, updateTokenStatus, 
  getTokensByDepartment, updateToken, getDailyStats, callNextToken, getDepartmentStatus,
  checkAndAutoComplete, autoCallNextToken
};