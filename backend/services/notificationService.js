const { v4: uuidv4 } = require("uuid");
const {
  Notification,
  User,
  Role,
  Complaint,
  Feedback,
  SectorRepresentative,
  SectorNode,
  sequelize,
} = require("../models");
const { sendEmail } = require("../utils/sendEmail");

class NotificationService {
  /**
   * Helper to fetch all users with 'admin' role
   */
  static async getAdminUsers(transaction = null) {
    return await User.findAll({
      include: [
        {
          model: Role,
          as: "roles",
          where: { name: "admin" },
          required: true,
        },
      ],
      where: { is_active: true },
      transaction,
    });
  }

  /**
   * Helper to fetch sector representative (Head of Sector)
   */
  static async getSectorHeads(sectorNodeId, transaction = null) {
    if (!sectorNodeId) return [];
    
    const representatives = await SectorRepresentative.findAll({
      where: { 
        sector_node_id: sectorNodeId,
        is_active: true 
      },
      include: [
        {
          model: User,
          as: "representative",
          where: { is_active: true },
        }
      ],
      transaction,
    });

    return representatives.map(r => r.representative).filter(Boolean);
  }

  /**
   * Base method to create a notification and send email
   */
  static async createNotification(data, transaction = null) {
    const {
      recipient_id,
      recipient_type,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      email,
    } = data;

    const notification = await Notification.create({
      notification_id: uuidv4(),
      recipient_id,
      recipient_type,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      is_read: false,
    }, { transaction });

    if (email) {
      try {
        await sendEmail(email, title, message);
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err.message);
      }
    }

    return notification;
  }

  /**
   * Notify on Complaint Submission
   */
  static async notifyComplaintSubmission(complaint, transaction = null) {
    const { sector_node_id, ticketing_code, complaint_id, compliant_user_id } = complaint;

    // 1. Get Sector Heads
    const sectorHeads = await this.getSectorHeads(sector_node_id, transaction);
    
    // 2. Get System Admins
    const admins = await this.getAdminUsers(transaction);

    const recipients = [...sectorHeads, ...admins];
    // De-duplicate recipients
    const uniqueRecipients = Array.from(new Map(recipients.map(u => [u.user_id, u])).values());

    for (const user of uniqueRecipients) {
      await this.createNotification({
        recipient_id: user.user_id,
        recipient_type: "internal",
        type: "COMPLAINT_SUBMITTED",
        title: "New Complaint Submitted",
        message: `A new complaint (${ticketing_code}) has been submitted to your sector.`,
        related_entity_type: "complaint",
        related_entity_id: complaint_id,
        email: user.email,
      }, transaction);
    }

    // 3. Notify Submitter (Success Message)
    if (compliant_user_id) {
       const submitter = await User.findByPk(compliant_user_id, { transaction });
       if (submitter && submitter.email) {
         await this.createNotification({
           recipient_id: submitter.user_id,
           recipient_type: "external",
           type: "SUBMISSION_SUCCESS",
           title: "Complaint Submitted Successfully",
           message: `Your complaint (${ticketing_code}) has been received. You can track its status using the ticketing code.`,
           related_entity_type: "complaint",
           related_entity_id: complaint_id,
           email: submitter.email,
         }, transaction);
       }
    }
  }

  /**
   * Notify on Feedback Submission
   */
  static async notifyFeedbackSubmission(feedback, transaction = null) {
    const { sector_node_id, feedback_id, full_name, email: submitterEmail } = feedback;

    // 1. Get Sector Heads & Admins
    const sectorHeads = await this.getSectorHeads(sector_node_id, transaction);
    const admins = await this.getAdminUsers(transaction);
    const recipients = [...sectorHeads, ...admins];
    const uniqueRecipients = Array.from(new Map(recipients.map(u => [u.user_id, u])).values());

    for (const user of uniqueRecipients) {
      await this.createNotification({
        recipient_id: user.user_id,
        recipient_type: "internal",
        type: "FEEDBACK_SUBMITTED",
        title: "New Feedback Received",
        message: `New feedback has been received from ${full_name} for your sector.`,
        related_entity_type: "feedback",
        related_entity_id: feedback_id,
        email: user.email,
      }, transaction);
    }

    // 2. Thank you message to submitter
    if (submitterEmail) {
      try {
        await sendEmail(submitterEmail, "Feedback Received", `Dear ${full_name}, thank you for your feedback! We appreciate your input.`);
      } catch (err) {
        console.error("Failed to send thank you email:", err.message);
      }
    }
  }

  /**
   * Notify on Complaint Assignment
   */
  static async notifyComplaintAssignment(complaint, assigneeId, transaction = null) {
    const { ticketing_code, complaint_id } = complaint;
    
    // 1. Notify Assignee
    const assignee = await User.findByPk(assigneeId, { transaction });
    if (assignee) {
      await this.createNotification({
        recipient_id: assignee.user_id,
        recipient_type: "internal",
        type: "COMPLAINT_ASSIGNED",
        title: "New Complaint Assigned",
        message: `You have been assigned to handle complaint ${ticketing_code}.`,
        related_entity_type: "complaint",
        related_entity_id: complaint_id,
        email: assignee.email,
      }, transaction);
    }

    // 2. Notify Admin/Head (Activity Record)
    const admins = await this.getAdminUsers(transaction);
    for (const admin of admins) {
       await this.createNotification({
        recipient_id: admin.user_id,
        recipient_type: "internal",
        type: "COMPLAINT_ASSIGNMENT_UPDATE",
        title: "Complaint Assigned",
        message: `Complaint ${ticketing_code} has been assigned to ${assignee?.full_name || 'a user'}.`,
        related_entity_type: "complaint",
        related_entity_id: complaint_id,
        email: admin.email,
      }, transaction);
    }
  }

  /**
   * Notify on Complaint Resolution
   */
  static async notifyComplaintResolution(complaint, transaction = null) {
    const { ticketing_code, complaint_id, compliant_user_id } = complaint;

    if (compliant_user_id) {
      const creator = await User.findByPk(compliant_user_id, { transaction });
      if (creator) {
        await this.createNotification({
          recipient_id: creator.user_id,
          recipient_type: "external",
          type: "COMPLAINT_RESOLVED",
          title: "Complaint Resolved",
          message: `Your complaint (${ticketing_code}) has been resolved. Please check the details in the system.`,
          related_entity_type: "complaint",
          related_entity_id: complaint_id,
          email: creator.email,
        }, transaction);
      }
    }
  }
}

module.exports = NotificationService;
