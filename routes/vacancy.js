const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const DbConnection = require('../configs/db.config');
const Vacancy = require('../models/Vacancy')
const { loginCheck } = require('./middlewares')

//Documentation for Swagger https://github.com/fliptoo/swagger-express 

/**
 * @swagger
 * /vacancy/create:
 *  get:
 *    description: render create page with form to create new Vacancy
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.get('/vacancy/create', loginCheck(), async (req, res, next) => {
  if (req.user.role !== 'company') {
    return res.redirect("/vacancies");
  }
  res.render('vacancy/addVacancy', { user: req.user });
});

/**
 * @swagger
 * /vacancy/create:
 *  post:
 *    description: use to create new Vacancy
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.post('/vacancy/create', loginCheck(), async (req, res, next) => {

  if (req.user.role !== 'company') {
    return res.redirect("/vacancies");
  }

  const {
    title,
    description,
    category,
    tags,
    location,
    companyId = req.user._id,
    contract,
    applications = []
  } = req.body

  try {
    const result = await Vacancy.create({
      title,
      description,
      category,
      tags,
      location,
      companyId,
      contract,
      applications
    })
    return res.redirect("/vacancies");
  } catch (error) {
    console.log(error)
  }
});

/**
 * @swagger
 * /vacancy/:id:
 *  get:
 *    description: render details page of Vacancy id
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.get('/vacancy/details/:id', loginCheck(), async (req, res, next) => {
  const { id } = req.params
  try {
    const vacancy = await Vacancy.findById(id)
    return res.render("vacancy/detailsVacancy", { vacancy, user: req.user });
  } catch (error) {
    console.log(error)
  }
});

/**
 * @swagger
 * /vacancies:
 *  get:
 *    description: render list of Vacancies
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.get('/vacancies', loginCheck(), async (req, res, next) => {

  try {

    if (req.user.role === "company") {
      const vacancies = await Vacancy.find({ companyId: req.user._id }).populate('companyId')

      return res.render("vacancy/listVacancies", { vacancies: vacancies, user: req.user });
    } else {
      const vacancies = await Vacancy.find().populate('companyId')

      return res.render("vacancy/listVacanciesPersonal", { vacancies: vacancies, user: req.user });
    }

  } catch (error) {
    console.log(error)
  }
});

/**
 * @swagger
 * /vacancy/delete/:id:
 *  delete:
 *    description: delete vacancy by ID
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.post('/vacancy/delete/:id', loginCheck(), async (req, res, next) => {
  if (req.user.role !== 'company') {
    return res.redirect("/vacancies");
  }
  const { id } = req.params
  try {
    const result = await Vacancy.findByIdAndDelete(id)
    return res.redirect("/vacancies");
  } catch (error) {
    console.log(error)
  }
});

/**
 * @swagger
 * /vacancy/edit/:id:
 *  put:
 *    description: delete vacancy by ID
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.post('/vacancy/edit/:id', loginCheck(), async (req, res, next) => {
  if (req.user.role !== 'company') {
    return res.redirect("/vacancies");
  }
  const { id } = req.params
  const {
    title,
    description,
    category,
    tags,
    location,
    contract,
  } = req.body

  try {
    const result = await Vacancy.findByIdAndUpdate(id, {
      title,
      description,
      category,
      tags,
      location,
      contract,
    })
    console.log(result)
    return res.redirect("/vacancies");
  } catch (error) {
    console.log(error)
  }
});
/**
 * @swagger
 * /vacancy/edit/:id:
 *  get:
 *    description: render edit page vacancy by ID
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.get('/vacancies/filters', loginCheck(), async (req, res, next) => {
  const { title = "", category = "", tags, location = "" } = req.query
  const query = { title: { $regex: `^${title}.*`, $options: 'si' }, category: { $regex: `^${category}.*`, $options: 'si' }, location: { $regex: `^${location}.*`, $options: 'si' } }
  try {
    const result = await Vacancy.find(query)
    return res.render("vacancy/listVacanciesPersonal", { vacancies: result });
  } catch (error) {
    console.log(error)
  }
});
/**
 * @swagger
 * /vacancy/edit/:id:
 *  get:
 *    description: render edit page vacancy by ID
 *    responses:
 *       '200': 
 *       description: Successfully   
 *       
 */
router.get('/vacancy/edit/:id', loginCheck(), async (req, res, next) => {
  if (req.user.role !== 'company') {
    return res.redirect("/vacancies");
  }
  const { id } = req.params

  try {
    const result = await Vacancy.findByIdAndUpdate(id)
    return res.render("vacancy/editVacancy", { vacancy: result });
  } catch (error) {
    console.log(error)
  }
});

module.exports = router;
