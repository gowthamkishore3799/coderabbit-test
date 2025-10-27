/**
 * Prisma Client Usage Examples
 *
 * This file demonstrates common patterns for using Prisma Client
 * in your application. Import the prisma instance from './prisma.js'
 */

import prisma from './prisma.js'

// Example 1: Create a new user
export async function createUser(email, name) {
  const user = await prisma.user.create({
    data: {
      email,
      name,
    },
  })
  return user
}

// Example 2: Get all users
export async function getAllUsers() {
  const users = await prisma.user.findMany()
  return users
}

// Example 3: Get user by email with their posts
export async function getUserWithPosts(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      posts: true,
    },
  })
  return user
}

// Example 4: Create a post for a user
export async function createPost(title, content, authorEmail) {
  const post = await prisma.post.create({
    data: {
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    },
  })
  return post
}

// Example 5: Update a post
export async function updatePost(postId, data) {
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data,
  })
  return updatedPost
}

// Example 6: Delete a user and their posts (cascade delete)
export async function deleteUser(userId) {
  // First delete all posts by this user
  await prisma.post.deleteMany({
    where: { authorId: userId },
  })

  // Then delete the user
  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  })

  return deletedUser
}

// Example 7: Get published posts with author info
export async function getPublishedPosts() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return posts
}

// Example 8: Transaction example - Create user and post atomically
export async function createUserWithPost(email, name, postTitle, postContent) {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
      },
    })

    const post = await tx.post.create({
      data: {
        title: postTitle,
        content: postContent,
        authorId: user.id,
      },
    })

    return { user, post }
  })

  return result
}
