"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const now = new Date();

    try {
      // 1. Ensure user type 'public' exists
      let publicTypeId;
      const userTypes = await queryInterface.sequelize.query(
        `SELECT user_type_id FROM user_types WHERE name = 'public' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (userTypes && userTypes.length > 0) {
        publicTypeId = userTypes[0].user_type_id;
      } else {
        publicTypeId = uuidv4();
        await queryInterface.bulkInsert(
          "user_types",
          [
            {
              user_type_id: publicTypeId,
              name: "public",
              description: "Public user",
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction }
        );
      }

      // 2. Ensure level 2 sectors exist (since dashboard queries level 2)
      let sectors = await queryInterface.sequelize.query(
        `SELECT sector_node_id FROM sector_nodes WHERE level = 2 LIMIT 10`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const sectorIds = [];
      if (sectors && sectors.length > 0) {
        sectorIds.push(...sectors.map(s => s.sector_node_id));
      } else {
        // Create demo sectors
        const demoSectors = ["Ministry Head Office", "Health Bureau", "Education Bureau", "Agriculture Bureau"];
        for (const name of demoSectors) {
          const sId = uuidv4();
          await queryInterface.bulkInsert("sector_nodes", [
            {
              sector_node_id: sId,
              name: name,
              level: 1,
              is_active: true,
              created_at: now,
              updated_at: now,
            }
          ], { transaction });
          
          const childNames = [`${name} North Branch`, `${name} South Branch`, `${name} Central Branch`];
          for (const child of childNames) {
            const childId = uuidv4();
            await queryInterface.bulkInsert("sector_nodes", [
              {
                sector_node_id: childId,
                name: child,
                level: 2,
                parent_id: sId,
                is_active: true,
                created_at: now,
                updated_at: now,
              }
            ], { transaction });
            sectorIds.push(childId);
          }
        }
      }

      // 3. Ensure multiple categories exist
      const categoryNames = ["Service Delay", "Staff Behavior", "Infrastructure", "Quality of Service", "Other"];
      const categoryIds = [];

      for (const name of categoryNames) {
        let categoryId;
        const categories = await queryInterface.sequelize.query(
          `SELECT category_id FROM complaint_categories WHERE name = '${name}' LIMIT 1`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (categories && categories.length > 0) {
          categoryId = categories[0].category_id;
        } else {
          categoryId = uuidv4();
          await queryInterface.bulkInsert(
            "complaint_categories",
            [
              {
                category_id: categoryId,
                name: name,
                description: `Complaints related to ${name.toLowerCase()}`,
                is_active: true,
                type: "external",
                created_at: now,
                updated_at: now,
              },
            ],
            { transaction }
          );
        }
        categoryIds.push(categoryId);
      }

      // 4. Generate 5000 complaints
      const statuses = ["pending", "under_review", "assigned", "in_progress", "resolved", "rejected", "closed"];
      const complaints = [];
      const nowMs = now.getTime();
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;

      for (let i = 1; i <= 5000; i++) {
        const date = new Date(nowMs - Math.random() * oneYearMs);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
        const sectorId = sectorIds[Math.floor(Math.random() * sectorIds.length)];
        
        complaints.push({
          complaint_id: uuidv4(),
          ticketing_code: `DEMO-TKT-${nowMs}-${i}`,
          compliant_type_id: publicTypeId,
          category_id: categoryId,
          sector_node_id: sectorId,
          department_id: Math.random() > 0.5 ? sectorId : null,
          description: `This is a demo complaint description ${i}. We need this issue resolved as it is affecting our daily operations. It falls under the selected category and requires attention.`,
          request: `Please address this demo issue ${i} immediately.`,
          status: status,
          is_anonymous: Math.random() > 0.8, // 20% anonymous
          created_at: date,
          updated_at: date,
        });
      }

      await queryInterface.bulkInsert("complaints", complaints, { transaction });
      console.log(`Inserted 5000 demo complaints successfully.`);

      // 5. Generate 3000 feedbacks
      const feedbacks = [];
      for (let i = 1; i <= 3000; i++) {
        const date = new Date(nowMs - Math.random() * oneYearMs);
        let rating = 1 + Math.floor(Math.random() * 5);
        if (Math.random() > 0.6) rating = Math.max(rating, 4);
        const sectorId = sectorIds[Math.floor(Math.random() * sectorIds.length)];

        feedbacks.push({
          feedback_id: uuidv4(),
          full_name: `Demo User ${i}`,
          feedback: `This is a demo feedback ${i}. I found the service to be ${rating >= 4 ? 'excellent' : (rating >= 3 ? 'okay' : 'needing improvement')}.`,
          rating: rating,
          sector_node_id: sectorId,
          created_at: date,
          updated_at: date,
        });
      }

      await queryInterface.bulkInsert("feedbacks", feedbacks, { transaction });
      console.log(`Inserted 3000 demo feedbacks successfully.`);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `DELETE FROM complaints WHERE ticketing_code LIKE 'DEMO-TKT-%'`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM feedbacks WHERE full_name LIKE 'Demo User %'`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM sector_nodes WHERE parent_id IN (SELECT sector_node_id FROM sector_nodes WHERE name IN ('Ministry Head Office', 'Health Bureau', 'Education Bureau', 'Agriculture Bureau'))`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM sector_nodes WHERE name IN ('Ministry Head Office', 'Health Bureau', 'Education Bureau', 'Agriculture Bureau')`,
        { transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
