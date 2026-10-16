const pool = require('../config/db');
const { makeSlug } = require('../utils/helpers');

// GET /api/blogs?page=&limit=&category=
exports.getAllBlogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "9", 10), 1);
    const offset = (page - 1) * limit;

    let where = "b.is_published = 1";
    const params = [];

    // Category filter
    if (req.query.category) {
      where += " AND bc.slug = ?";
      params.push(req.query.category);
    }

    // Get blogs
    const [rows] = await pool.query(
      `
      SELECT
        b.id,
        b.title,
        b.slug,
        b.excerpt,
        b.cover_image_url,
        b.author_name,
        b.published_at,
        bc.name AS category_name,
        bc.slug AS category_slug
      FROM blogs b
      LEFT JOIN blog_categories bc
        ON bc.id = b.category_id
      WHERE ${where}
      ORDER BY b.published_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    // image paths -> full URLs are added centrally (middleware/imageUrl.js)
    const blogs = rows;

    // Get total count
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM blogs b
      LEFT JOIN blog_categories bc
        ON bc.id = b.category_id
      WHERE ${where}
      `,
      params
    );

    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getAllBlogs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};
exports.getCategories = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM blog_categories ORDER BY name');
  res.json({ success: true, categories: rows });
};

// GET /api/blogs/:slug
exports.getBlogBySlug = async (req, res) => {
  try {
    // Get blog by slug
    const [rows] = await pool.query(
      `
      SELECT
        b.*,
        bc.name AS category_name,
        bc.slug AS category_slug
      FROM blogs b
      LEFT JOIN blog_categories bc
        ON bc.id = b.category_id
      WHERE b.slug = ?
        AND b.is_published = 1
      LIMIT 1
      `,
      [req.params.slug]
    );

    // Blog not found
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blog = rows[0];

    // Increase views
    await pool.query(
      "UPDATE blogs SET views = views + 1 WHERE id = ?",
      [blog.id]
    );

    // Get recent posts
    const [recent] = await pool.query(
      `
      SELECT
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        author_name,
        published_at
      FROM blogs
      WHERE is_published = 1
        AND id != ?
      ORDER BY published_at DESC
      LIMIT 4
      `,
      [blog.id]
    );

    const recentPosts = recent;

    return res.status(200).json({
      success: true,
      blog,
      recentPosts,
    });
  } catch (error) {
    console.error("getBlogBySlug Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};
// ---------- ADMIN ----------
exports.adminGetAllBlogs = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM blogs ORDER BY id DESC');
  res.json({ success: true, blogs: rows });
};

exports.createBlog = async (req, res) => {
  try {
    const { category_id, title, excerpt, content, cover_image_url, author_name, is_published, meta_title, meta_description } = req.body;
    const slug = makeSlug(title);
    const [result] = await pool.query(
      `INSERT INTO blogs (category_id, title, slug, excerpt, content, cover_image_url, author_name, is_published, published_at, meta_title, meta_description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id || null, title, slug, excerpt, content, cover_image_url, author_name || 'Neurocare Clinic', is_published ? 1 : 0, is_published ? new Date() : null, meta_title, meta_description]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create blog' });
  }
};

exports.updateBlog = async (req, res) => {
  const fields = req.body;
  if (fields.title) fields.slug = makeSlug(fields.title);
  if (fields.is_published === true || fields.is_published === 1) {
    const [existing] = await pool.query('SELECT published_at FROM blogs WHERE id = ?', [req.params.id]);
    if (existing.length && !existing[0].published_at) fields.published_at = new Date();
  }
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  await pool.query(`UPDATE blogs SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), req.params.id]);
  res.json({ success: true, message: 'Blog updated' });
};

exports.deleteBlog = async (req, res) => {
  await pool.query('DELETE FROM blogs WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Blog deleted' });
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const slug = makeSlug(name);
  const [result] = await pool.query('INSERT INTO blog_categories (name, slug) VALUES (?,?)', [name, slug]);
  res.status(201).json({ success: true, id: result.insertId });
};
