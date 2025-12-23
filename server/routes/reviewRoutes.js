import express from 'express'
import { createReview, getReviewsByCase, listAllReviews } from '../controller/reviewController.js'

const router = express.Router()

router.post('/', createReview)
router.get('/', listAllReviews)
router.get('/:caseId', getReviewsByCase)

export default router
