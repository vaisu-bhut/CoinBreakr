const Group = require('../../models/Group');
const User = require('../../models/User');

describe('Group Model Unit Tests', () => {
  let testUser1, testUser2, testUser3;

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
  });

  describe('Group Creation', () => {
    it('should create a group with valid data', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group for testing',
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'admin',
          joinedAt: new Date()
        }]
      };

      const group = new Group(groupData);
      await group.save();

      expect(group.name).toBe(groupData.name);
      expect(group.description).toBe(groupData.description);
      expect(group.createdBy.toString()).toBe(testUser1._id.toString());
      expect(group.members).toHaveLength(1);
      expect(group.members[0].user.toString()).toBe(testUser1._id.toString());
      expect(group.members[0].role).toBe('admin');
      expect(group.isActive).toBe(true);
    });

    it('should create a group with minimal data', async () => {
      const groupData = {
        name: 'Minimal Group',
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'admin'
        }]
      };

      const group = new Group(groupData);
      await group.save();

      expect(group.name).toBe(groupData.name);
      expect(group.description).toBe('');
      expect(group.isActive).toBe(true);
    });

    it('should fail to create group without name', async () => {
      const groupData = {
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'admin'
        }]
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should fail to create group without creator', async () => {
      const groupData = {
        name: 'Test Group',
        members: [{
          user: testUser1._id,
          role: 'admin'
        }]
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should fail to create group without members', async () => {
      const groupData = {
        name: 'Test Group',
        createdBy: testUser1._id
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should fail to create group with name too long', async () => {
      const groupData = {
        name: 'a'.repeat(101), // 101 characters
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'admin'
        }]
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should fail to create group with description too long', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'a'.repeat(501), // 501 characters
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'admin'
        }]
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });

    it('should fail to create group with invalid member role', async () => {
      const groupData = {
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [{
          user: testUser1._id,
          role: 'invalid_role'
        }]
      };

      const group = new Group(groupData);
      await expect(group.save()).rejects.toThrow();
    });
  });

  describe('Group Virtual Properties', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = new Group({
        name: 'Test Group',
        description: 'A test group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser3._id, role: 'admin' }
        ]
      });
      await testGroup.save();
    });

    it('should calculate member count correctly', () => {
      expect(testGroup.memberCount).toBe(3);
    });

    it('should return admin members correctly', () => {
      const admins = testGroup.admins;
      expect(admins).toHaveLength(2);
      expect(admins.every(member => member.role === 'admin')).toBe(true);
    });
  });

  describe('Group Instance Methods', () => {
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

    describe('isMember', () => {
      it('should return true for existing member', () => {
        expect(testGroup.isMember(testUser1._id)).toBe(true);
        expect(testGroup.isMember(testUser2._id)).toBe(true);
      });

      it('should return false for non-member', () => {
        expect(testGroup.isMember(testUser3._id)).toBe(false);
      });

      it('should handle string and ObjectId inputs', () => {
        expect(testGroup.isMember(testUser1._id.toString())).toBe(true);
        expect(testGroup.isMember(testUser1._id)).toBe(true);
      });
    });

    describe('isAdmin', () => {
      it('should return true for admin member', () => {
        expect(testGroup.isAdmin(testUser1._id)).toBe(true);
      });

      it('should return false for non-admin member', () => {
        expect(testGroup.isAdmin(testUser2._id)).toBe(false);
      });

      it('should return false for non-member', () => {
        expect(testGroup.isAdmin(testUser3._id)).toBe(false);
      });

      it('should handle string and ObjectId inputs', () => {
        expect(testGroup.isAdmin(testUser1._id.toString())).toBe(true);
        expect(testGroup.isAdmin(testUser1._id)).toBe(true);
      });
    });

    describe('addMember', () => {
      it('should add a new member successfully', () => {
        testGroup.addMember(testUser3._id, 'member');
        
        expect(testGroup.members).toHaveLength(3);
        expect(testGroup.isMember(testUser3._id)).toBe(true);
        
        const newMember = testGroup.members.find(m => m.user.toString() === testUser3._id.toString());
        expect(newMember.role).toBe('member');
        expect(newMember.joinedAt).toBeInstanceOf(Date);
      });

      it('should add a new admin member', () => {
        testGroup.addMember(testUser3._id, 'admin');
        
        const newMember = testGroup.members.find(m => m.user.toString() === testUser3._id.toString());
        expect(newMember.role).toBe('admin');
      });

      it('should throw error when adding existing member', () => {
        expect(() => {
          testGroup.addMember(testUser1._id, 'member');
        }).toThrow('User is already a member of this group');
      });

      it('should default to member role when not specified', () => {
        testGroup.addMember(testUser3._id);
        
        const newMember = testGroup.members.find(m => m.user.toString() === testUser3._id.toString());
        expect(newMember.role).toBe('member');
      });
    });

    describe('removeMember', () => {
      it('should remove a member successfully', () => {
        testGroup.removeMember(testUser2._id);
        
        expect(testGroup.members).toHaveLength(1);
        expect(testGroup.isMember(testUser2._id)).toBe(false);
        expect(testGroup.isMember(testUser1._id)).toBe(true);
      });

      it('should throw error when removing non-member', () => {
        expect(() => {
          testGroup.removeMember(testUser3._id);
        }).toThrow('User is not a member of this group');
      });

      it('should handle string and ObjectId inputs', () => {
        testGroup.removeMember(testUser2._id.toString());
        expect(testGroup.isMember(testUser2._id)).toBe(false);
      });
    });

    describe('updateMemberRole', () => {
      it('should update member role successfully', () => {
        testGroup.updateMemberRole(testUser2._id, 'admin');
        
        const member = testGroup.members.find(m => m.user.toString() === testUser2._id.toString());
        expect(member.role).toBe('admin');
        expect(testGroup.isAdmin(testUser2._id)).toBe(true);
      });

      it('should throw error when updating non-member role', () => {
        expect(() => {
          testGroup.updateMemberRole(testUser3._id, 'admin');
        }).toThrow('User is not a member of this group');
      });

      it('should handle string and ObjectId inputs', () => {
        testGroup.updateMemberRole(testUser2._id.toString(), 'admin');
        expect(testGroup.isAdmin(testUser2._id)).toBe(true);
      });
    });
  });

  describe('Group Static Methods', () => {
    let testGroup1, testGroup2;

    beforeEach(async () => {
      testGroup1 = new Group({
        name: 'Group 1',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' }
        ]
      });
      await testGroup1.save();

      testGroup2 = new Group({
        name: 'Group 2',
        createdBy: testUser2._id,
        members: [
          { user: testUser2._id, role: 'admin' },
          { user: testUser3._id, role: 'member' }
        ]
      });
      await testGroup2.save();
    });

    describe('getGroupsForUser', () => {
      it('should return groups for user 1', async () => {
        const groups = await Group.getGroupsForUser(testUser1._id);
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe('Group 1');
      });

      it('should return groups for user 2', async () => {
        const groups = await Group.getGroupsForUser(testUser2._id);
        expect(groups).toHaveLength(2);
        expect(groups.map(g => g.name)).toContain('Group 1');
        expect(groups.map(g => g.name)).toContain('Group 2');
      });

      it('should return empty array for user with no groups', async () => {
        const newUser = new User({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        });
        await newUser.save();

        const groups = await Group.getGroupsForUser(newUser._id);
        expect(groups).toHaveLength(0);
      });

      it('should only return active groups', async () => {
        testGroup1.isActive = false;
        await testGroup1.save();

        const groups = await Group.getGroupsForUser(testUser1._id);
        expect(groups).toHaveLength(0);
      });

      it('should populate user data correctly', async () => {
        const groups = await Group.getGroupsForUser(testUser1._id);
        expect(groups[0].members[0].user.name).toBe('Test User 1');
        expect(groups[0].createdBy.name).toBe('Test User 1');
      });
    });

    describe('getGroupWithMembers', () => {
      it('should return group with populated members', async () => {
        const group = await Group.getGroupWithMembers(testGroup1._id);
        
        expect(group.name).toBe('Group 1');
        expect(group.members).toHaveLength(2);
        expect(group.members[0].user.name).toBe('Test User 1');
        expect(group.members[1].user.name).toBe('Test User 2');
        expect(group.createdBy.name).toBe('Test User 1');
      });

      it('should return null for non-existent group', async () => {
        const fakeId = testUser1._id; // Use a valid ObjectId but not a group
        const group = await Group.getGroupWithMembers(fakeId);
        expect(group).toBeNull();
      });
    });
  });

  describe('Group Pre-save Hooks', () => {
    it('should update updatedAt field on save', async () => {
      const group = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      
      const originalUpdatedAt = group.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
      await group.save();
      
      expect(group.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should update updatedAt field on findOneAndUpdate', async () => {
      const group = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();
      
      const originalUpdatedAt = group.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms
      
      await Group.findByIdAndUpdate(group._id, { name: 'Updated Group' });
      const updatedGroup = await Group.findById(group._id);
      
      expect(updatedGroup.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Group Edge Cases', () => {
    it('should handle empty members array', async () => {
      const group = new Group({
        name: 'Empty Group',
        createdBy: testUser1._id,
        members: []
      });
      
      await expect(group.save()).rejects.toThrow();
    });

    it('should handle duplicate members in array', async () => {
      const group = new Group({
        name: 'Duplicate Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser1._id, role: 'member' } // Duplicate user
        ]
      });
      
      await group.save();
      expect(group.members).toHaveLength(2);
    });

    it('should handle special characters in name and description', async () => {
      const group = new Group({
        name: 'Group with Special Chars: !@#$%^&*()',
        description: 'Description with émojis 🚀 and unicode: 中文',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      
      await group.save();
      expect(group.name).toBe('Group with Special Chars: !@#$%^&*()');
      expect(group.description).toBe('Description with émojis 🚀 and unicode: 中文');
    });

    it('should handle very long but valid name', async () => {
      const longName = 'a'.repeat(100); // Exactly 100 characters
      const group = new Group({
        name: longName,
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      
      await group.save();
      expect(group.name).toBe(longName);
    });

    it('should handle very long but valid description', async () => {
      const longDescription = 'a'.repeat(500); // Exactly 500 characters
      const group = new Group({
        name: 'Test Group',
        description: longDescription,
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      
      await group.save();
      expect(group.description).toBe(longDescription);
    });

    it('should handle null and undefined values gracefully', async () => {
      const group = new Group({
        name: 'Test Group',
        description: null,
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      
      await group.save();
      expect(group.description).toBe('');
    });
  });

  describe('Group Data Integrity', () => {
    it('should maintain referential integrity with users', async () => {
      const group = new Group({
        name: 'Test Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();
      
      // Delete the user
      await User.findByIdAndDelete(testUser1._id);
      
      // Group should still exist but with orphaned references
      const foundGroup = await Group.findById(group._id);
      expect(foundGroup).toBeTruthy();
      expect(foundGroup.createdBy.toString()).toBe(testUser1._id.toString());
    });

    it('should handle concurrent member additions', async () => {
      const group = new Group({
        name: 'Concurrent Group',
        createdBy: testUser1._id,
        members: [{ user: testUser1._id, role: 'admin' }]
      });
      await group.save();
      
      // Simulate concurrent additions
      const group1 = await Group.findById(group._id);
      const group2 = await Group.findById(group._id);
      
      group1.addMember(testUser2._id, 'member');
      group2.addMember(testUser3._id, 'member');
      
      await group1.save();
      await group2.save();
      
      const finalGroup = await Group.findById(group._id);
      expect(finalGroup.members).toHaveLength(3);
    });
  });
});
