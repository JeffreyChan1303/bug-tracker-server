import UserModel from '../../models/user.js';

const getAllUsersBySearch = async (req, res) => {
  const { page, searchQuery } = req.query;

  try {
    const search = new RegExp(searchQuery, 'i'); // 'i' stands for ignore case
    const itemsPerPage = 8;
    const startIndex = (Number(page) - 1) * itemsPerPage;
    const total = await UserModel.countDocuments({
      $or: [{ name: search }, { email: search }],
    });

    // $or means: either find me the title or other things in the array
    const users = await UserModel.find(
      { $or: [{ name: search }, { email: search }] },
      '-notifications'
    )
      .sort({ _id: -1 })
      .limit(itemsPerPage)
      .skip(startIndex);

    return res.status(200).json({
      data: users,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / itemsPerPage),
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export default getAllUsersBySearch;
