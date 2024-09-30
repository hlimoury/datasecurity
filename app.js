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

app.use(express.urlencoded({ extended: true })); // Parse incoming request bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'datasecurity2024@', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));


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







app.get('/', async function(req, res) {
  try {
    const database = db.getDb();
    const services = await database.collection('services').find().toArray();  // Fetch services
    res.render('index', { services : services});
} catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).send('Error fetching services');
}
  });
  






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
 
  app.get('/admin', ensureAuthenticated,function(req, res) {
    res.render('admin');
  });
    


app.get('/adminbrand', ensureAuthenticated,async function (req, res) {
    try {
      const database = db.getDb();
      const brands = await database.collection('brands').find().toArray(); // Fetch brands
      res.render('add-brand', {
        brands
      });
    } catch (err) {
      console.error('Error fetching brands:', err);
      res.status(500).send('Error fetching brands');
    }
});

    app.post('/adminbrand',ensureAuthenticated, async (req, res) => {
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


  app.post('/deletebrand/:id', ensureAuthenticated,async (req, res) => {
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



app.get('/adminservice',ensureAuthenticated, async (req, res) => {
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
app.post('/deleteservice/:id', ensureAuthenticated,async (req, res) => {
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





app.get('/adminproduct',ensureAuthenticated, async (req, res) => {
  try {
      const database = db.getDb();
      const products = await database.collection('products').find().toArray();  // Fetch products
      const brands = await database.collection('brands').find().toArray(); // Fetch brands for the dropdown
      const services = await database.collection('services').find().toArray(); // Fetch services for the dropdown
      res.render('add-products', { products, brands, services });
  } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Error fetching products');
  }
});

// Add a new product
app.post('/adminproduct',ensureAuthenticated, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
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
          pdf: pdfPath
      });
      res.redirect('/adminproduct');
  } catch (err) {
      console.error('Error adding product:', err);
      res.status(500).send('Error adding product');
  }
});

// Delete a product
app.post('/deleteproduct/:id',ensureAuthenticated, async (req, res) => {
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







app.get('/service/:id/products', async (req, res) => {
  try {
    const serviceId = req.params.id;
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

    // Fetch all products related to the selected service and brand
    const products = await database.collection('products').find(productsQuery).toArray();

    // Render the products page with the related data
    res.render('products-by-service', {
      service,
      products,
      services,
      brands,
      query: req.query,
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




app.locals.truncateText = function (text, maxLength) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  } else {
    return text;
  }
};






app.use(function(req, res) {
  res.status(404).render('404'); // 404 middleware for unknown routes
});

// 500 Internal Server Error Middleware
app.use(function(err, req, res, next) { // Correct parameters
  console.error('Server error:', err);
  res.status(500).render('500');
});


db.connectToDatabase().then(function(){
  app.listen(3000);
});

