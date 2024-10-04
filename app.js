// app.js

const path = require('path');
const express = require('express');
const mongodb = require("mongodb");
const db = require("./data/data-products");
const multer = require('multer');
const session = require('express-session');

const app = express();
const ObjectId = mongodb.ObjectId;

// Activate EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse incoming request bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'datasecurity2024@', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, 'public/uploads/pdfs/'); // Ensure the 'public/uploads/pdfs/' directory exists
    } else if (file.mimetype.startsWith('image')) {
      cb(null, 'public/uploads/images/'); // Ensure the 'public/uploads/images/' directory exists
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// **New Multer configuration for client logos**
const clientStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, 'public/uploads/images/clients/'); // Ensure this directory exists
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, 'client-logo-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadClientLogo = multer({ storage: clientStorage });


// Multer storage configuration for project images
// Multer storage configuration for project images
const projectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, 'public/uploads/images/projects/'); // Assurez-vous que ce répertoire existe
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, 'project-image-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadProjectImage = multer({ storage: projectStorage });

// Multer storage configuration for brand images
const brandImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('image')) {
      cb(null, 'public/uploads/images/brands/'); // Assurez-vous que ce répertoire existe
    } else {
      cb(new Error('Type de fichier invalide'), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, 'brand-image-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadBrandImage = multer({ storage: brandImageStorage });


// Routes

app.get('/get-favicon', async (req, res) => {
  const { url } = req.query;

  try {
    const favicon = await faviconFetcher.fetch(url);
    res.json({ favicon });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch favicon', error });
  }
});

app.get('/', async function(req, res) {
  try {
    const database = db.getDb();
    const services = await database.collection('services').find().toArray();
    const clients = await database.collection('clients').find().toArray();
    const newProducts = await database.collection('products')
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    const projects = await database.collection('projects')
      .find()
      .toArray(); // Récupérer tous les projets
    const brandImages = await database.collection('brand_images')
      .find()
      .toArray(); // Récupérer toutes les images de marques

    res.render('index', { services, clients, newProducts, projects, brandImages });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  }
});



// Authentication routes

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple authentication check
  if (username === 'admin' && password === 'datasecurity2024@') {
    // Authentication successful
    req.session.isAuthenticated = true;
    res.redirect('/admin');
  } else {
    // Authentication failed
    res.render('login', { error: 'Invalid username or password' });
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    // User is authenticated, proceed to the next middleware
    return next();
  } else {
    // User is not authenticated, redirect to login page
    res.redirect('/login');
  }
}

app.get('/admin', ensureAuthenticated, function(req, res) {
  res.render('admin');
});

// Brand routes

app.get('/adminbrand', ensureAuthenticated, async function (req, res) {
  try {
    const database = db.getDb();
    const brands = await database.collection('brands').find().toArray(); // Fetch brands
    res.render('add-brand', { brands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).send('Error fetching brands');
  }
});

app.post('/adminbrand', ensureAuthenticated, async (req, res) => {
  const { name } = req.body;
  try {
    const database = db.getDb();  // Get the database connection
    await database.collection('brands').insertOne({ name: name });
    res.redirect('/adminbrand');
  } catch (err) {
    console.error('Error adding brand:', err);
    res.status(500).send('Error adding brand');
  }
});

app.post('/deletebrand/:id', ensureAuthenticated, async (req, res) => {
  const brandId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('brands').deleteOne({ _id: new ObjectId(brandId) });
    res.redirect('/adminbrand');
  } catch (err) {
    console.error('Error deleting brand:', err);
    res.status(500).send('Error deleting brand');
  }
});

// Display all brands with edit options
app.get('/adminbrandupdate', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const brands = await database.collection('brands').find().toArray(); // Fetch brands
    res.render('update-brand', { brands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).send('Error fetching brands');
  }
});

// Display the form to edit a specific brand
app.get('/editbrand/:id', ensureAuthenticated, async (req, res) => {
  const brandId = req.params.id;
  try {
    const database = db.getDb();
    const brand = await database.collection('brands').findOne({ _id: new ObjectId(brandId) });
    res.render('edit-brand', { brand });
  } catch (err) {
    console.error('Error fetching brand:', err);
    res.status(500).send('Error fetching brand');
  }
});

// Handle the update of a brand
app.post('/editbrand/:id', ensureAuthenticated, async (req, res) => {
  const brandId = req.params.id;
  const { name } = req.body;
  try {
    const database = db.getDb();
    await database.collection('brands').updateOne(
      { _id: new ObjectId(brandId) },
      { $set: { name } }
    );
    res.redirect('/adminbrandupdate');
  } catch (err) {
    console.error('Error updating brand:', err);
    res.status(500).send('Error updating brand');
  }
});

// Service routes

app.get('/adminservice', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const services = await database.collection('services').find().toArray();  // Fetch services
    res.render('add-service', { services });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Error fetching services');
  }
});

// Add a new service
app.post('/adminservice', upload.single('image'), async (req, res) => {
  const { title, summary, description } = req.body;
  const imagePath = req.file ? req.file.path.replace('public', '') : '';  // Store relative image path

  try {
    const database = db.getDb();
    await database.collection('services').insertOne({
      title,
      summary,
      description,
      image: imagePath
    });
    res.redirect('/adminservice');
  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).send('Error adding service');
  }
});

// Delete a service
app.post('/deleteservice/:id', ensureAuthenticated, async (req, res) => {
  const serviceId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('services').deleteOne({ _id: new ObjectId(serviceId) });
    res.redirect('/adminservice');
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).send('Error deleting service');
  }
});

// Display all services with edit options
app.get('/adminserviceupdate', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const services = await database.collection('services').find().toArray(); // Fetch services
    res.render('update-service', { services });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Error fetching services');
  }
});

// Display the form to edit a specific service
app.get('/editservice/:id', ensureAuthenticated, async (req, res) => {
  const serviceId = req.params.id;
  try {
    const database = db.getDb();
    const service = await database.collection('services').findOne({ _id: new ObjectId(serviceId) });
    res.render('edit-service', { service });
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).send('Error fetching service');
  }
});

// Handle the update of a service
app.post('/editservice/:id', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const serviceId = req.params.id;
  const { title, summary, description } = req.body;
  const updateData = { title, summary, description };

  // Handle image upload if a new image is provided
  if (req.file) {
    const imagePath = req.file.path.replace('public', '');
    updateData.image = imagePath;
  }

  try {
    const database = db.getDb();
    await database.collection('services').updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: updateData }
    );
    res.redirect('/adminserviceupdate');
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).send('Error updating service');
  }
});

// Product routes

app.get('/adminproduct', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const productsCollection = database.collection('products');

    // Fetch brands and services for the dropdowns
    const brands = await database.collection('brands').find().toArray();
    const services = await database.collection('services').find().toArray();

    // Build the query object
    let query = {};

    // Handle Brand Filter
    if (req.query.brand) {
      query.brand = new ObjectId(req.query.brand);
    }

    // Handle Service Filter
    if (req.query.service) {
      query.service = new ObjectId(req.query.service);
    }

    // Handle Search Filter
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { reference: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Fetch products based on the query
    const products = await productsCollection.find(query).toArray();

    res.render('add-products', {
      products,
      brands,
      services,
      query: req.query
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Error fetching products');
  }
});

// Add a new product
// Add a new product
app.post('/adminproduct', ensureAuthenticated, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  const { name, reference, description, brand, service } = req.body;

  const imagePath = req.files['image'] ? req.files['image'][0].path.replace('public', '') : '';
  const pdfPath = req.files['pdf'] ? req.files['pdf'][0].path.replace('public', '') : '';

  try {
    const database = db.getDb();
    await database.collection('products').insertOne({
      name,
      reference,
      description,
      brand: new ObjectId(brand),
      service: new ObjectId(service),
      image: imagePath,
      pdf: pdfPath,
      createdAt: new Date() // Ajoutez cette ligne pour enregistrer la date de création
    });
    res.redirect('/adminproduct');
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).send('Error adding product');
  }
});


// Delete a product
app.post('/deleteproduct/:id', ensureAuthenticated, async (req, res) => {
  const productId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('products').deleteOne({ _id: new ObjectId(productId) });
    res.redirect('/adminproduct');
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Error deleting product');
  }
});

// Display all products with edit options
app.get('/adminproductupdate', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const productsCollection = database.collection('products');

    // Fetch brands and services for the dropdowns
    const brands = await database.collection('brands').find().toArray();
    const services = await database.collection('services').find().toArray();

    // Build the query object (for sorting and filtering)
    let query = {};

    // Handle Brand Filter
    if (req.query.brand) {
      query.brand = new ObjectId(req.query.brand);
    }

    // Handle Service Filter
    if (req.query.service) {
      query.service = new ObjectId(req.query.service);
    }

    // Handle Search Filter
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { reference: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Fetch products based on the query
    const products = await productsCollection.find(query).toArray();

    res.render('update-product', {
      products,
      brands,
      services,
      query: req.query,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Error fetching products');
  }
});

// Display the form to edit a specific product
app.get('/editproduct/:id', ensureAuthenticated, async (req, res) => {
  const productId = req.params.id;
  try {
    const database = db.getDb();
    const product = await database.collection('products').findOne({ _id: new ObjectId(productId) });
    const brands = await database.collection('brands').find().toArray();
    const services = await database.collection('services').find().toArray();

    res.render('edit-product', { product, brands, services });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).send('Error fetching product');
  }
});

// Handle the update of a product
app.post('/editproduct/:id', ensureAuthenticated, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
  const productId = req.params.id;
  const { name, reference, description, brand, service } = req.body;

  const updateData = {
    name,
    reference,
    description,
    brand: new ObjectId(brand),
    service: new ObjectId(service),
  };

  // Handle image upload if a new image is provided
  if (req.files['image']) {
    const imagePath = req.files['image'][0].path.replace('public', '');
    updateData.image = imagePath;
  }

  // Handle PDF upload if a new PDF is provided
  if (req.files['pdf']) {
    const pdfPath = req.files['pdf'][0].path.replace('public', '');
    updateData.pdf = pdfPath;
  }

  try {
    const database = db.getDb();
    await database.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );
    res.redirect('/adminproductupdate');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Error updating product');
  }
});

// Service products route

app.get('/service/:id/products', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const page = parseInt(req.query.page) || 1; // Numéro de page, par défaut 1
    const limit = 10; // Nombre de produits par page
    const skip = (page - 1) * limit; // Calcul du nombre de documents à sauter

    const database = db.getDb();

    // Fetch the specific service by ID
    const service = await database.collection('services').findOne({ _id: new ObjectId(serviceId) });

    if (!service) {
      return res.status(404).send('Service not found');
    }

    // Fetch all brands
    const brands = await database.collection('brands').find().toArray();

    // Fetch all services
    const services = await database.collection('services').find().toArray();

    // Build the products query
    let productsQuery = { service: new ObjectId(serviceId) };

    // If a brand filter is applied
    if (req.query.brand) {
      productsQuery.brand = new ObjectId(req.query.brand);
    }

    // Handle Search Query
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      productsQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Get the total count of products matching the query
    const totalProducts = await database.collection('products').countDocuments(productsQuery);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch products based on the query with pagination
    const products = await database.collection('products')
      .find(productsQuery)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Render the products page with the related data
    res.render('products-by-service', {
      service,
      products,
      services,
      brands,
      query: req.query,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error('Error fetching products for the service:', err);
    res.status(500).send('Server error');
  }
});


// Product Details Route
app.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const database = db.getDb();

    // Fetch the product by ID
    const product = await database.collection('products').findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Fetch related brand and service information
    const brand = await database.collection('brands').findOne({ _id: product.brand });
    const service = await database.collection('services').findOne({ _id: product.service });

    // Render the product details page
    res.render('product-details', { product, brand, service });
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).send('Server error');
  }
});

// **Clients management routes**

// Display the admin clients page
app.get('/adminclients', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const clients = await database.collection('clients').find().toArray(); // Fetch clients
    res.render('admin-clients', { clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).send('Error fetching clients');
  }
});

// Add a new client
app.post('/adminclients', ensureAuthenticated, uploadClientLogo.single('logo'), async (req, res) => {
  const { name, website } = req.body;
  const logoPath = req.file ? req.file.path.replace('public', '') : '';

  try {
    const database = db.getDb();
    await database.collection('clients').insertOne({
      name,
      website,
      logo: logoPath
    });
    res.redirect('/adminclients');
  } catch (err) {
    console.error('Error adding client:', err);
    res.status(500).send('Error adding client');
  }
});

// Delete a client
app.post('/deleteclient/:id', ensureAuthenticated, async (req, res) => {
  const clientId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('clients').deleteOne({ _id: new ObjectId(clientId) });
    res.redirect('/adminclients');
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).send('Error deleting client');
  }
});

// Display all clients with edit options
app.get('/adminclientsupdate', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const clients = await database.collection('clients').find().toArray(); // Fetch clients
    res.render('update-clients', { clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).send('Error fetching clients');
  }
});

// Display the form to edit a specific client
app.get('/editclient/:id', ensureAuthenticated, async (req, res) => {
  const clientId = req.params.id;
  try {
    const database = db.getDb();
    const client = await database.collection('clients').findOne({ _id: new ObjectId(clientId) });
    res.render('edit-client', { client });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).send('Error fetching client');
  }
});

// Handle the update of a client
app.post('/editclient/:id', ensureAuthenticated, uploadClientLogo.single('logo'), async (req, res) => {
  const clientId = req.params.id;
  const { name, website } = req.body;
  const updateData = { name, website };

  // Handle logo upload if a new logo is provided
  if (req.file) {
    const logoPath = req.file.path.replace('public', '');
    updateData.logo = logoPath;
  }

  try {
    const database = db.getDb();
    await database.collection('clients').updateOne(
      { _id: new ObjectId(clientId) },
      { $set: updateData }
    );
    res.redirect('/adminclientsupdate');
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).send('Error updating client');
  }
});


//adminprojects
app.get('/adminprojects', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const projects = await database.collection('projects').find().toArray();
    res.render('admin-projects', { projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).send('Error fetching projects');
  }
});

app.post('/adminprojects', ensureAuthenticated, uploadProjectImage.single('image'), async (req, res) => {
  const { title, phrase } = req.body;
  const imagePath = req.file ? req.file.path.replace('public', '') : '';
  try {
    const database = db.getDb();
    await database.collection('projects').insertOne({
      title,
      phrase,
      image: imagePath,
      createdAt: new Date()
    });
    res.redirect('/adminprojects');
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).send('Error adding project');
  }
});


app.post('/deleteproject/:id', ensureAuthenticated, async (req, res) => {
  const projectId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('projects').deleteOne({ _id: new ObjectId(projectId) });
    res.redirect('/adminprojects');
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).send('Error deleting project');
  }
});

app.get('/editproject/:id', ensureAuthenticated, async (req, res) => {
  const projectId = req.params.id;
  try {
    const database = db.getDb();
    const project = await database.collection('projects').findOne({ _id: new ObjectId(projectId) });
    res.render('edit-project', { project });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).send('Error fetching project');
  }
});

app.post('/editproject/:id', ensureAuthenticated, async (req, res) => {
  const projectId = req.params.id;
  const { title, phrase } = req.body;
  // Si vous avez une image, gérez-la ici
  // const imagePath = req.file ? req.file.path.replace('public', '') : '';
  const updateData = {
    title,
    phrase,
    // image: imagePath
  };
  try {
    const database = db.getDb();
    await database.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    );
    res.redirect('/adminprojects');
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).send('Error updating project');
  }
});


// Afficher le formulaire d'ajout et la liste des images de marques
app.get('/adminbrandimage', ensureAuthenticated, async (req, res) => {
  try {
    const database = db.getDb();
    const brandImages = await database.collection('brand_images').find().toArray();
    res.render('admin-brand-images', { brandImages });
  } catch (err) {
    console.error('Erreur lors de la récupération des images de marques:', err);
    res.status(500).send('Erreur lors de la récupération des images de marques');
  }
});

// Ajouter une nouvelle image de marque
app.post('/adminbrandimage', ensureAuthenticated, uploadBrandImage.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file ? req.file.path.replace('public', '') : '';

  try {
    const database = db.getDb();
    await database.collection('brand_images').insertOne({
      name,
      image: imagePath,
      createdAt: new Date()
    });
    res.redirect('/adminbrandimage');
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'image de marque:', err);
    res.status(500).send('Erreur lors de l\'ajout de l\'image de marque');
  }
});

// Supprimer une image de marque
app.post('/deletebrandimage/:id', ensureAuthenticated, async (req, res) => {
  const brandImageId = req.params.id;
  try {
    const database = db.getDb();
    await database.collection('brand_images').deleteOne({ _id: new ObjectId(brandImageId) });
    res.redirect('/adminbrandimage');
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'image de marque:', err);
    res.status(500).send('Erreur lors de la suppression de l\'image de marque');
  }
});


app.get('/editbrandimage/:id', ensureAuthenticated, async (req, res) => {
  const brandImageId = req.params.id;
  try {
    const database = db.getDb();
    const brandImage = await database.collection('brand_images').findOne({ _id: new ObjectId(brandImageId) });
    res.render('edit-brand-image', { brandImage });
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'image de marque:', err);
    res.status(500).send('Erreur lors de la récupération de l\'image de marque');
  }
});


app.post('/editbrandimage/:id', ensureAuthenticated, uploadBrandImage.single('image'), async (req, res) => {
  const brandImageId = req.params.id;
  const { name } = req.body;
  const updateData = { name };

  // Gérer le téléchargement de l'image si une nouvelle image est fournie
  if (req.file) {
    const imagePath = req.file.path.replace('public', '');
    updateData.image = imagePath;
  }

  try {
    const database = db.getDb();
    await database.collection('brand_images').updateOne(
      { _id: new ObjectId(brandImageId) },
      { $set: updateData }
    );
    res.redirect('/adminbrandimage');
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'image de marque:', err);
    res.status(500).send('Erreur lors de la mise à jour de l\'image de marque');
  }
});



// Helper function to truncate text
app.locals.truncateText = function (text, maxLength) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  } else {
    return text;
  }
};

// Error handling

// 404 middleware for unknown routes
app.use(function(req, res) {
  res.status(404).render('404');
});

// 500 Internal Server Error Middleware
app.use(function(err, req, res, next) {
  console.error('Server error:', err);
  res.status(500).render('500');
});

// Start the server after connecting to the database
db.connectToDatabase().then(function(){
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
});
