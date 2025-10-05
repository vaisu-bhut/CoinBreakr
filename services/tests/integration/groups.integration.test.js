const request = require('supertest');
const app = require('../test-server');
const User = require('../../models/User');
const Group = require('../../models/Group');

describe('Groups Integration Tests', () => {
  let testUser1, testUser2, testUser3, testUser4;
  let token1, token2, token3, token4;

  beforeEach(async () => {
    // Create test users
    testUser1 = new User({
      name: 'Test User 1',
      email: 'user1@example.com',
      password: 'password123'
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Test User 2',
      email: 'user2@example.com',
      password: 'password123'
    });
    await testUser2.save();

    testUser3 = new User({
      name: 'Test User 3',
      email: 'user3@example.com',
      password: 'password123'
    });
    await testUser3.save();

    testUser4 = new User({
      name: 'Test User 4',
      email: 'user4@example.com',
      password: 'password123'
    });
    await testUser4.save();

    // Get tokens for all users
    const login1 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token1 = login1.body.data.token;

    const login2 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' });
    token2 = login2.body.data.token;

    const login3 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user3@example.com', password: 'password123' });
    token3 = login3.body.data.token;

    const login4 = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'user4@example.com', password: 'password123' });
    token4 = login4.body.data.token;
  });

  describe('POST /v1/groups - Create Group', () => {
    it('should create a group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group for testing'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBe(groupData.description);
      expect(response.body.data.createdBy._id).toBe(testUser1._id.toString());
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].user._id).toBe(testUser1._id.toString());
      expect(response.body.data.members[0].role).toBe('admin');
    });

    it('should create a group with minimal data', async () => {
      const groupData = {
        name: 'Minimal Group'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBe('');
    });

    it('should fail to create group without name', async () => {
      const groupData = {
        description: 'A group without name'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should fail to create group with empty name', async () => {
      const groupData = {
        name: '',
        description: 'A group with empty name'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create group with name too long', async () => {
      const groupData = {
        name: 'a'.repeat(101),
        description: 'A group with very long name'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create group with description too long', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'a'.repeat(501)
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create group without authentication', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group'
      };

      const response = await request(app)
        .post('/v1/groups')
        .send(groupData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail to create group with invalid token', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', 'Bearer invalid-token')
        .send(groupData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in name and description', async () => {
      const groupData = {
        name: 'Group with Special Chars: !@#$%^&*()',
        description: 'Description with émojis 🚀 and unicode: 中文'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(groupData.name);
      expect(response.body.data.description).toBe(groupData.description);
    });
  });

  describe('GET /v1/groups - Get User Groups', () => {
    let group1, group2, group3;

    beforeEach(async () => {
      // Create groups
      group1 = new Group({
        name: 'Group 1',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await group1.save();

      group2 = new Group({
        name: 'Group 2',
        createdBy: testUser2._id,
        members: [
          { user: testUser2._id, role: 'admin' },
          { user: testUser1._id, role: 'member' },
          { user: testUser3._id, role: 'member' }
        ]
      });
      await group2.save();

      group3 = new Group({
        name: 'Group 3',
        createdBy: testUser3._id,
        members: [
          { user: testUser3._id, role: 'admin' },
          { user: testUser4._id, role: 'member' }
        ]
      });
      await group3.save();
    });

    it('should get all groups for user 1', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(g => g.name)).toContain('Group 1');
      expect(response.body.data.map(g => g.name)).toContain('Group 2');
    });

    it('should get all groups for user 2', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(g => g.name)).toContain('Group 1');
      expect(response.body.data.map(g => g.name)).toContain('Group 2');
    });

    it('should get all groups for user 3', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token3}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(g => g.name)).toContain('Group 2');
      expect(response.body.data.map(g => g.name)).toContain('Group 3');
    });

    it('should get all groups for user 4', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token4}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Group 3');
    });

    it('should populate member and creator data', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const group = response.body.data[0];
      expect(group.members[0].user.name).toBeDefined();
      expect(group.members[0].user.email).toBeDefined();
      expect(group.createdBy.name).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/v1/groups')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/groups/:id - Get Specific Group', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        description: 'A test group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should get group successfully for member', async () => {
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Group');
      expect(response.body.data.description).toBe('A test group');
      expect(response.body.data.members).toHaveLength(2);
    });

    it('should get group successfully for another member', async () => {
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Group');
    });

    it('should fail to get group for non-member', async () => {
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail to get non-existent group', async () => {
      const fakeId = testUser1._id; // Valid ObjectId but not a group
      const response = await request(app)
        .get(`/v1/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/v1/groups/${testGroup._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /v1/groups/:id - Update Group', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Original Group',
        description: 'Original description',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should update group name successfully', async () => {
      const updateData = {
        name: 'Updated Group Name'
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Group Name');
      expect(response.body.data.description).toBe('Original description');
    });

    it('should update group description successfully', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Original Group');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should update both name and description', async () => {
      const updateData = {
        name: 'Updated Group',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Group');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should allow member to update group', async () => {
      const updateData = {
        name: 'Updated by Member'
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated by Member');
    });

    it('should fail to update for non-member', async () => {
      const updateData = {
        name: 'Updated by Non-Member'
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail to update non-existent group', async () => {
      const fakeId = testUser1._id;
      const updateData = {
        name: 'Updated Group'
      };

      const response = await request(app)
        .put(`/v1/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with empty name', async () => {
      const updateData = {
        name: ''
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with name too long', async () => {
      const updateData = {
        name: 'a'.repeat(101)
      };

      const response = await request(app)
        .put(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /v1/groups/:id - Delete Group', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should delete group successfully by creator', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify group is soft deleted
      const deletedGroup = await Group.findById(testGroup._id);
      expect(deletedGroup.isActive).toBe(false);
    });

    it('should fail to delete group by non-creator', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only the group creator can delete');

      // Verify group still exists
      const group = await Group.findById(testGroup._id);
      expect(group.isActive).toBe(true);
    });

    it('should fail to delete non-existent group', async () => {
      const fakeId = testUser1._id;
      const response = await request(app)
        .delete(`/v1/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/groups/:id/members - Add Member', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should add member successfully', async () => {
      const memberData = {
        memberEmail: 'user3@example.com',
        role: 'member'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(3);
      
      const newMember = response.body.data.members.find(m => m.user.email === 'user3@example.com');
      expect(newMember).toBeDefined();
      expect(newMember.role).toBe('member');
    });

    it('should add member as admin', async () => {
      const memberData = {
        memberEmail: 'user3@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const newMember = response.body.data.members.find(m => m.user.email === 'user3@example.com');
      expect(newMember.role).toBe('admin');
    });

    it('should default to member role when not specified', async () => {
      const memberData = {
        memberEmail: 'user3@example.com'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const newMember = response.body.data.members.find(m => m.user.email === 'user3@example.com');
      expect(newMember.role).toBe('member');
    });

    it('should allow any member to add new members', async () => {
      const memberData = {
        memberEmail: 'user3@example.com'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token2}`)
        .send(memberData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail to add non-existent user', async () => {
      const memberData = {
        memberEmail: 'nonexistent@example.com'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should fail to add existing member', async () => {
      const memberData = {
        memberEmail: 'user2@example.com'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a member');
    });

    it('should fail to add member for non-member', async () => {
      const memberData = {
        memberEmail: 'user3@example.com'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token3}`)
        .send(memberData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail with invalid email', async () => {
      const memberData = {
        memberEmail: 'invalid-email'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const memberData = {
        memberEmail: 'user3@example.com',
        role: 'invalid_role'
      };

      const response = await request(app)
        .post(`/v1/groups/${testGroup._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send(memberData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /v1/groups/:id/members/:memberId - Remove Member', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser3._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should allow user to remove themselves', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser2._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(2);
      
      const remainingMembers = response.body.data.members.map(m => m.user._id);
      expect(remainingMembers).not.toContain(testUser2._id.toString());
    });

    it('should allow admin to remove other members', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(2);
    });

    it('should fail for non-admin to remove others', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser2._id}`)
        .set('Authorization', `Bearer ${token3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('can only remove yourself');
    });

    it('should fail to remove non-member', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser4._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found in this group');
    });

    it('should fail for non-member to remove anyone', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/members/${testUser2._id}`)
        .set('Authorization', `Bearer ${token4}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });
  });

  describe('DELETE /v1/groups/:id/leave - Leave Group', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser3._id, role: 'member' }
        ]
      });
      await testGroup.save();
    });

    it('should allow member to leave group', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/leave`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('left the group successfully');

      // Verify user is removed from group
      const updatedGroup = await Group.findById(testGroup._id);
      expect(updatedGroup.members).toHaveLength(2);
      expect(updatedGroup.isMember(testUser2._id)).toBe(false);
    });

    it('should allow admin to leave group', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/leave`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is removed from group
      const updatedGroup = await Group.findById(testGroup._id);
      expect(updatedGroup.members).toHaveLength(2);
      expect(updatedGroup.isMember(testUser1._id)).toBe(false);
    });

    it('should fail for non-member to leave', async () => {
      const response = await request(app)
        .delete(`/v1/groups/${testGroup._id}/leave`)
        .set('Authorization', `Bearer ${token4}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not a member');
    });

    it('should fail for non-existent group', async () => {
      const fakeId = testUser1._id;
      const response = await request(app)
        .delete(`/v1/groups/${fakeId}/leave`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Group Edge Cases', () => {
    it('should handle concurrent group operations', async () => {
      const group = new Group({
        name: 'Concurrent Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();

      // Simulate concurrent member additions
      const promises = [
        request(app)
          .post(`/v1/groups/${group._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user2@example.com' }),
        request(app)
          .post(`/v1/groups/${group._id}/members`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ memberEmail: 'user3@example.com' })
      ];

      const responses = await Promise.all(promises);
      
      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify final state
      const finalGroup = await Group.findById(group._id);
      expect(finalGroup.members).toHaveLength(3);
    });

    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Group", "description": "Test"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large request bodies', async () => {
      const largeDescription = 'a'.repeat(10000);
      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Large Group',
          description: largeDescription
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle special characters in member email', async () => {
      const group = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();

      const response = await request(app)
        .post(`/v1/groups/${group._id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmail: 'user+test@example.com' })
        .expect(404); // User doesn't exist

      expect(response.body.success).toBe(false);
    });
  });
});
