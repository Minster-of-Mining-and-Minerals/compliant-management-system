// =========== Get complaint by user ID ===========
const getComplaintByUserId = async (req, res) => {
  try {
    const compliant_user_id = req.user?.user_id;

    if (!isUuid(compliant_user_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereClause = { compliant_user_id };
    if (status) whereClause.status = status;

    const { count, rows: complaints } = await Complaint.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["user_id", "full_name"],
        },
        {
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitInt,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: complaints,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page),
        itemsPerPage: limitInt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};
