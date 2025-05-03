import React, { useState, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Paper, TextField, MenuItem, Button, IconButton,
  FormControl, InputLabel, Select, FormControlLabel, Checkbox, CircularProgress,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Tabs, Tab,
  Divider, List, ListItem, ListItemText,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Grading as GradingIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { coursesAPI, assessmentAPI } from '../../../config'; // Adjust path as needed

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Question Form Component
const QuestionForm = ({ question, index, onUpdate, onDelete, assessmentType, readOnly = false }) => {
  const handleQuestionChange = (field, value) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const handleOptionChange = (optionIndex, field, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    onUpdate(index, { ...question, options: newOptions });
  };

  const addOption = () => {
    onUpdate(index, {
      ...question,
      options: [...question.options, { text: '', is_correct: false }],
    });
  };

  const removeOption = (optionIndex) => {
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    onUpdate(index, { ...question, options: newOptions });
  };

  const questionTypes = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
    { value: 'matching', label: 'Matching' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
  ];

  return (
    <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Question {index + 1}</Typography>
        {!readOnly && (
          <IconButton onClick={() => onDelete(index)} color="error">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Question Text"
            value={question.text}
            onChange={(e) => handleQuestionChange('text', e.target.value)}
            multiline
            rows={3}
            required
            InputProps={{ readOnly }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Question Type</InputLabel>
            <Select
              value={question.question_type}
              onChange={(e) => handleQuestionChange('question_type', e.target.value)}
              label="Question Type"
              disabled={readOnly || assessmentType === 'assignment' || assessmentType === 'peer_assessment'}
            >
              {questionTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Points"
            type="number"
            value={question.points}
            onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, readOnly }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Explanation (Optional)"
            value={question.explanation}
            onChange={(e) => handleQuestionChange('explanation', e.target.value)}
            multiline
            rows={2}
            InputProps={{ readOnly }}
          />
        </Grid>
        {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Options</Typography>
            {question.options.map((option, optIndex) => (
              <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  label={`Option ${optIndex + 1}`}
                  value={option.text}
                  onChange={(e) => handleOptionChange(optIndex, 'text', e.target.value)}
                  sx={{ mr: 2 }}
                  required
                  InputProps={{ readOnly }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={option.is_correct}
                      onChange={(e) => handleOptionChange(optIndex, 'is_correct', e.target.checked)}
                      disabled={readOnly}
                    />
                  }
                  label="Correct"
                />
                {!readOnly && (
                  <IconButton
                    onClick={() => removeOption(optIndex)}
                    disabled={question.options.length <= (question.question_type === 'true_false' ? 2 : 2)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && question.question_type !== 'true_false' && (
              <Button startIcon={<AddIcon />} onClick={addOption}>
                Add Option
              </Button>
            )}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

// Rubric Form Component
const RubricForm = ({ rubric, index, onUpdate, onDelete, readOnly = false }) => {
  const handleRubricChange = (field, value) => {
    onUpdate(index, { ...rubric, [field]: value });
  };

  return (
    <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Rubric Criterion {index + 1}</Typography>
        {!readOnly && (
          <IconButton onClick={() => onDelete(index)} color="error">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Criterion"
            value={rubric.criterion}
            onChange={(e) => handleRubricChange('criterion', e.target.value)}
            required
            InputProps={{ readOnly }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Weight (%)"
            type="number"
            value={rubric.weight}
            onChange={(e) => handleRubricChange('weight', parseInt(e.target.value) || 100)}
            inputProps={{ min: 1, max: 100, readOnly }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description (Optional)"
            value={rubric.description}
            onChange={(e) => handleRubricChange('description', e.target.value)}
            multiline
            rows={2}
            InputProps={{ readOnly }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// View Assessment Dialog Component
const ViewAssessmentDialog = ({ assessment, open, onClose, courseMap, assessmentTypes }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{assessment.title}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {courseMap[assessment.course_id] || 'Unknown Course'} • Due: {format(new Date(assessment.due_date), 'MMM dd, yyyy')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Details</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Type</Typography>
            <Typography>{assessmentTypes.find((type) => type.value === assessment.assessment_type)?.label || assessment.assessment_type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={assessment.status === 'published' ? (new Date(assessment.due_date) > new Date() ? 'Active' : 'Closed') : 'Draft'}
              color={assessment.status === 'published' && new Date(assessment.due_date) > new Date() ? 'primary' : 'default'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Passing Score (%)</Typography>
            <Typography>{assessment.passing_score}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Max Attempts</Typography>
            <Typography>{assessment.max_attempts === 0 ? 'Unlimited' : assessment.max_attempts}</Typography>
          </Grid>
          {assessment.time_limit && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Time Limit (minutes)</Typography>
              <Typography>{assessment.time_limit}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Description</Typography>
            <Typography>{assessment.description || 'No description provided'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Instructions</Typography>
            <Typography>{assessment.instructions || 'No instructions provided'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Shuffle Questions</Typography>
            <Typography>{assessment.shuffle_questions ? 'Yes' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Show Correct Answers</Typography>
            <Typography>{assessment.show_correct_answers ? 'Yes' : 'No'}</Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>Questions</Typography>
        {assessment.questions?.length > 0 ? (
          assessment.questions.map((question, index) => (
            <QuestionForm
              key={question.id || index}
              question={question}
              index={index}
              onUpdate={() => {}} // No-op for read-only
              onDelete={() => {}} // No-op for read-only
              assessmentType={assessment.assessment_type}
              readOnly
            />
          ))
        ) : (
          <Typography color="text.secondary">No questions added.</Typography>
        )}

        {(assessment.assessment_type === 'assignment' || assessment.assessment_type === 'peer_assessment') && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Rubrics</Typography>
            {assessment.rubrics?.length > 0 ? (
              assessment.rubrics.map((rubric, index) => (
                <RubricForm
                  key={rubric.id || index}
                  rubric={rubric}
                  index={index}
                  onUpdate={() => {}} // No-op for read-only
                  onDelete={() => {}} // No-op for read-only
                  readOnly
                />
              ))
            ) : (
              <Typography color="text.secondary">No rubrics added.</Typography>
            )}
          </>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Attachments</Typography>
        {assessment.attachments?.length > 0 ? (
          <List>
            {assessment.attachments.map((attachment, index) => (
              <ListItem key={attachment.id || index}>
                <ListItemText
                  primary={attachment.name}
                  secondary={attachment.description || 'No description'}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No attachments added.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Main AssessmentManager Component
const AssessmentManager = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editAssessmentId, setEditAssessmentId] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    assessment_type: 'quiz',
    description: '',
    due_date: dayjs().add(7, 'day'),
    time_limit: '',
    passing_score: 70,
    max_attempts: 1,
    shuffle_questions: false,
    show_correct_answers: false,
    instructions: '',
    status: 'draft',
  });
  const [questions, setQuestions] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '' });
  const [tabValue, setTabValue] = useState(0);
  const [viewAssessment, setViewAssessment] = useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <InnerAssessmentManager
        navigate={navigate}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        editAssessmentId={editAssessmentId}
        setEditAssessmentId={setEditAssessmentId}
        formData={formData}
        setFormData={setFormData}
        questions={questions}
        setQuestions={setQuestions}
        rubrics={rubrics}
        setRubrics={setRubrics}
        attachments={attachments}
        setAttachments={setAttachments}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        tabValue={tabValue}
        setTabValue={setTabValue}
        viewAssessment={viewAssessment}
        setViewAssessment={setViewAssessment}
      />
    </QueryClientProvider>
  );
};

// Inner component to handle the actual logic
const InnerAssessmentManager = ({
  navigate,
  showCreateForm,
  setShowCreateForm,
  editAssessmentId,
  setEditAssessmentId,
  formData,
  setFormData,
  questions,
  setQuestions,
  rubrics,
  setRubrics,
  attachments,
  setAttachments,
  snackbar,
  setSnackbar,
  validationErrors,
  setValidationErrors,
  confirmDialog,
  setConfirmDialog,
  tabValue,
  setTabValue,
  viewAssessment,
  setViewAssessment,
}) => {
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['instructorCourses'],
    queryFn: () => coursesAPI.getCourses({ instructor: 'me' }),
  });

  // Fetch assessments
  const { data: assessmentsData, isLoading: assessmentsLoading, error: assessmentsError } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => assessmentAPI.getAssessments({ instructor: 'me' }),
  });

  // Mutation for creating assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (data) => {
      const assessmentResponse = await assessmentAPI.createAssessment({
        ...data,
        course_id: data.course,
        due_date: data.due_date.toISOString(),
        time_limit: data.time_limit ? parseInt(data.time_limit) : null,
        passing_score: parseInt(data.passing_score),
        max_attempts: parseInt(data.max_attempts),
      });

      const assessmentId = assessmentResponse.data.id;

      // Create questions
      for (const [index, question] of questions.entries()) {
        const questionData = {
          question_type: question.question_type,
          text: question.text,
          points: question.points,
          explanation: question.explanation,
          order: index,
        };
        const questionResponse = await assessmentAPI.createQuestion(assessmentId, questionData);
        const questionId = questionResponse.data.id;

        // Create options for MCQ or True/False
        if (question.options && (question.question_type === 'mcq' || question.question_type === 'true_false')) {
          for (const [optIndex, option] of question.options.entries()) {
            await assessmentAPI.createQuestionOption(assessmentId, questionId, {
              text: option.text,
              is_correct: option.is_correct,
              order: optIndex,
            });
          }
        }
      }

      // Create rubrics
      for (const [index, rubric] of rubrics.entries()) {
        await assessmentAPI.createRubric(assessmentId, {
          criterion: rubric.criterion,
          description: rubric.description,
          weight: rubric.weight,
          order: index,
        });
      }

      // Upload attachments
      for (const attachment of attachments) {
        const formData = new FormData();
        formData.append('file', attachment.file);
        formData.append('name', attachment.name);
        formData.append('description', attachment.description);
        await assessmentAPI.uploadAttachment(assessmentId, formData);
      }

      return assessmentResponse.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assessments']);
      setSnackbar({
        open: true,
        message: `Assessment "${data.title}" created successfully`,
        severity: 'success',
      });
      resetForm();
    },
    onError: (error) => {
      let errorMessage = 'Failed to create assessment';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.course_id) {
        errorMessage = error.response.data.course_id[0];
      } else if (error.message) {
        errorMessage = error.message.replace(/^API Error: \d{3}\s/, '');
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  // Mutation for updating assessment
  const updateAssessmentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const assessmentResponse = await assessmentAPI.updateAssessment(id, {
        ...data,
        course_id: data.course,
        due_date: data.due_date.toISOString(),
        time_limit: data.time_limit ? parseInt(data.time_limit) : null,
        passing_score: parseInt(data.passing_score),
        max_attempts: parseInt(data.max_attempts),
      });

      // Delete existing questions and create new ones
      await assessmentAPI.deleteAllQuestions(id);
      for (const [index, question] of questions.entries()) {
        const questionData = {
          question_type: question.question_type,
          text: question.text,
          points: question.points,
          explanation: question.explanation,
          order: index,
        };
        const questionResponse = await assessmentAPI.createQuestion(id, questionData);
        const questionId = questionResponse.data.id;

        if (question.options && (question.question_type === 'mcq' || question.question_type === 'true_false')) {
          for (const [optIndex, option] of question.options.entries()) {
            await assessmentAPI.createQuestionOption(id, questionId, {
              text: option.text,
              is_correct: option.is_correct,
              order: optIndex,
            });
          }
        }
      }

      // Delete existing rubrics and create new ones
      await assessmentAPI.deleteAllRubrics(id);
      for (const [index, rubric] of rubrics.entries()) {
        await assessmentAPI.createRubric(id, {
          criterion: rubric.criterion,
          description: rubric.description,
          weight: rubric.weight,
          order: index,
        });
      }

      // Delete existing attachments and upload new ones
      await assessmentAPI.deleteAllAttachments(id);
      for (const attachment of attachments) {
        const formData = new FormData();
        formData.append('file', attachment.file);
        formData.append('name', attachment.name);
        formData.append('description', attachment.description);
        await assessmentAPI.uploadAttachment(id, formData);
      }

      return assessmentResponse.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assessments']);
      setSnackbar({
        open: true,
        message: `Assessment "${data.title}" updated successfully`,
        severity: 'success',
      });
      resetForm();
    },
    onError: (error) => {
      let errorMessage = 'Failed to update assessment';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.course_id) {
        errorMessage = error.response.data.course_id[0];
      } else if (error.message) {
        errorMessage = error.message.replace(/^API Error: \d{3}\s/, '');
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  const resetForm = () => {
    setShowCreateForm(false);
    setEditAssessmentId(null);
    setFormData({
      course: '',
      title: '',
      assessment_type: 'quiz',
      description: '',
      due_date: dayjs().add(7, 'day'),
      time_limit: '',
      passing_score: 70,
      max_attempts: 1,
      shuffle_questions: false,
      show_correct_answers: false,
      instructions: '',
      status: 'draft',
    });
    setQuestions([]);
    setRubrics([]);
    setAttachments([]);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.course) errors.course = 'Course is required';
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.due_date) errors.due_date = 'Due date is required';
    if (formData.passing_score < 0 || formData.passing_score > 100) {
      errors.passing_score = 'Passing score must be between 0 and 100';
    }
    if (formData.max_attempts < 0) errors.max_attempts = 'Max attempts cannot be negative';
    if (formData.time_limit && formData.time_limit < 0) errors.time_limit = 'Time limit cannot be negative';
    if (questions.length === 0) errors.questions = 'At least one question is required';
    for (const [index, question] of questions.entries()) {
      if (!question.text) errors[`question_${index}_text`] = 'Question text is required';
      if (!question.points || question.points < 1) errors[`question_${index}_points`] = 'Points must be at least 1';
      if (question.question_type === 'mcq' && question.options.length < 2) {
        errors[`question_${index}_options`] = 'At least two options are required for MCQ';
      }
      if (question.question_type === 'mcq' && !question.options.some((opt) => opt.is_correct)) {
        errors[`question_${index}_correct`] = 'At least one correct option is required';
      }
      for (const [optIndex, option] of question.options.entries()) {
        if (!option.text) errors[`question_${index}_option_${optIndex}`] = 'Option text is required';
      }
    }
    for (const [index, rubric] of rubrics.entries()) {
      if (!rubric.criterion) errors[`rubric_${index}_criterion`] = 'Criterion is required';
      if (!rubric.weight || rubric.weight < 1 || rubric.weight > 100) {
        errors[`rubric_${index}_weight`] = 'Weight must be between 1 and 100';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addQuestion = () => {
    const newQuestion = {
      question_type: formData.assessment_type === 'quiz' ? 'mcq' : 'essay',
      text: '',
      points: 1,
      explanation: '',
      options:
        formData.assessment_type === 'quiz'
          ? [
              { text: '', is_correct: false },
              { text: '', is_correct: false },
            ]
          : [],
    };
    if (newQuestion.question_type === 'true_false') {
      newQuestion.options = [
        { text: 'True', is_correct: false },
        { text: 'False', is_correct: false },
      ];
    }
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? updatedQuestion : q))
    );
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(prev).forEach((key) => {
        if (key.startsWith(`question_${index}_`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const deleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(prev).forEach((key) => {
        if (key.startsWith(`question_${index}_`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const addRubric = () => {
    setRubrics((prev) => [
      ...prev,
      { criterion: '', description: '', weight: 100 },
    ]);
  };

  const updateRubric = (index, updatedRubric) => {
    setRubrics((prev) =>
      prev.map((r, i) => (i === index ? updatedRubric : r))
    );
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(prev).forEach((key) => {
        if (key.startsWith(`rubric_${index}_`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const deleteRubric = (index) => {
    setRubrics((prev) => prev.filter((_, i) => i !== index));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(prev).forEach((key) => {
        if (key.startsWith(`rubric_${index}_`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachments((prev) => [
        ...prev,
        { file, name: file.name, description: '' },
      ]);
    }
  };

  const updateAttachment = (index, field, value) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, [field]: value } : att))
    );
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (status) => {
    setFormData((prev) => ({ ...prev, status }));
    setConfirmDialog({ open: true, action: status });
  };

  const confirmSubmit = () => {
    if (validateForm()) {
      if (editAssessmentId) {
        updateAssessmentMutation.mutate({ id: editAssessmentId, data: formData });
      } else {
        createAssessmentMutation.mutate(formData);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Please fix the form errors before submitting',
        severity: 'error',
      });
    }
    setConfirmDialog({ open: false, action: '' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleViewSubmissions = (assessment) => {
    navigate(`/instructor/assessments/${assessment.id}/submissions`);
  };

  const handleViewAssessment = (assessment) => {
    setViewAssessment(assessment);
  };

  const handleEditAssessment = (assessment) => {
    setEditAssessmentId(assessment.id);
    setFormData({
      course: assessment.course_id,
      title: assessment.title,
      assessment_type: assessment.assessment_type,
      description: assessment.description || '',
      due_date: dayjs(assessment.due_date),
      time_limit: assessment.time_limit || '',
      passing_score: assessment.passing_score,
      max_attempts: assessment.max_attempts,
      shuffle_questions: assessment.shuffle_questions,
      show_correct_answers: assessment.show_correct_answers,
      instructions: assessment.instructions || '',
      status: assessment.status,
    });
    setQuestions(assessment.questions || []);
    setRubrics(assessment.rubrics || []);
    setAttachments(assessment.attachments?.map((att) => ({
      file: null, // File uploads need re-selection
      name: att.name,
      description: att.description || '',
    })) || []);
    setShowCreateForm(true);
  };

  const assessmentTypes = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'peer_assessment', label: 'Peer Assessment' },
    { value: 'certification_exam', label: 'Certification Exam' },
  ];

  // Filter assessments based on tab
  const filteredAssessments = assessmentsData?.data.results?.filter((assessment) => {
    const now = new Date();
    const dueDate = new Date(assessment.due_date);
    if (tabValue === 0) return dueDate > now && assessment.status === 'published'; // Active
    if (tabValue === 1) return dueDate > now && assessment.status === 'draft'; // Upcoming
    if (tabValue === 2) return dueDate <= now || assessment.status === 'closed'; // Completed
    return true;
  }) || [];

  // Map course IDs to titles
  const courseMap = coursesData?.data.results?.reduce((map, course) => {
    map[course.id] = course.title;
    return map;
  }, {}) || {};

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Assessments</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (showCreateForm && editAssessmentId) {
                resetForm();
              }
              setShowCreateForm(!showCreateForm);
            }}
          >
            {showCreateForm ? 'Hide Form' : 'Create Assessment'}
          </Button>
        </Box>

        {/* Assessments List */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="Active" />
            <Tab label="Upcoming" />
            <Tab label="Completed" />
          </Tabs>
          {assessmentsLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : assessmentsError ? (
            <Alert severity="error">Error loading assessments</Alert>
          ) : filteredAssessments.length === 0 ? (
            <Typography color="text.secondary">No assessments available.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id} hover>
                      <TableCell>{assessment.title}</TableCell>
                      <TableCell>{courseMap[assessment.course_id] || 'Unknown Course'}</TableCell>
                      <TableCell>{format(new Date(assessment.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{assessmentTypes.find((type) => type.value === assessment.assessment_type)?.label || assessment.assessment_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={assessment.status === 'published' ? (new Date(assessment.due_date) > new Date() ? 'Active' : 'Closed') : 'Draft'}
                          color={assessment.status === 'published' && new Date(assessment.due_date) > new Date() ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewAssessment(assessment)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<GradingIcon />}
                          onClick={() => handleViewSubmissions(assessment)}
                        >
                          Grade
                        </Button>
                        <IconButton size="small" onClick={() => handleEditAssessment(assessment)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* View Assessment Dialog */}
        {viewAssessment && (
          <ViewAssessmentDialog
            assessment={viewAssessment}
            open={!!viewAssessment}
            onClose={() => setViewAssessment(null)}
            courseMap={courseMap}
            assessmentTypes={assessmentTypes}
          />
        )}

        {/* Create/Edit Assessment Form */}
        {showCreateForm && (
          <>
            <Typography variant="h4" gutterBottom>
              {editAssessmentId ? 'Edit Assessment' : 'Create Assessment'}
            </Typography>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!validationErrors.course}>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={formData.course}
                      onChange={(e) => handleFormChange('course', e.target.value)}
                      label="Course"
                      disabled={coursesLoading}
                    >
                      {coursesLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={24} />
                        </MenuItem>
                      ) : coursesError ? (
                        <MenuItem disabled>Error loading courses</MenuItem>
                      ) : coursesData?.data.results?.length > 0 ? (
                        coursesData.data.results.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.title}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No courses available</MenuItem>
                      )}
                    </Select>
                    {validationErrors.course && (
                      <Typography color="error" variant="caption">
                        {validationErrors.course}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    error={!!validationErrors.title}
                    helperText={validationErrors.title}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Assessment Type</InputLabel>
                    <Select
                      value={formData.assessment_type}
                      onChange={(e) => {
                        handleFormChange('assessment_type', e.target.value);
                        setQuestions([]);
                      }}
                      label="Assessment Type"
                    >
                      {assessmentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Due Date"
                    value={formData.due_date}
                    onChange={(value) => handleFormChange('due_date', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!validationErrors.due_date}
                        helperText={validationErrors.due_date}
                        required
                      />
                    )}
                    minDateTime={dayjs()}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Time Limit (minutes)"
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => handleFormChange('time_limit', e.target.value)}
                    error={!!validationErrors.time_limit}
                    helperText={validationErrors.time_limit}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Passing Score (%)"
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => handleFormChange('passing_score', parseInt(e.target.value) || 70)}
                    error={!!validationErrors.passing_score}
                    helperText={validationErrors.passing_score}
                    inputProps={{ min: 0, max: 100 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Max Attempts (0 for unlimited)"
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => handleFormChange('max_attempts', parseInt(e.target.value) || 1)}
                    error={!!validationErrors.max_attempts}
                    helperText={validationErrors.max_attempts}
                    inputProps={{ min: 0 }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructions"
                    value={formData.instructions}
                    onChange={(e) => handleFormChange('instructions', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.shuffle_questions}
                        onChange={(e) => handleFormChange('shuffle_questions', e.target.checked)}
                      />
                    }
                    label="Shuffle Questions"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.show_correct_answers}
                        onChange={(e) => handleFormChange('show_correct_answers', e.target.checked)}
                      />
                    }
                    label="Show Correct Answers After Submission"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Questions Section */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Questions</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={addQuestion}>
                  Add Question
                </Button>
              </Box>
              {validationErrors.questions && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationErrors.questions}
                </Alert>
              )}
              {questions.length === 0 ? (
                <Typography color="text.secondary">No questions added yet.</Typography>
              ) : (
                questions.map((question, index) => (
                  <QuestionForm
                    key={index}
                    question={question}
                    index={index}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    assessmentType={formData.assessment_type}
                  />
                ))
              )}
            </Paper>

            {/* Rubrics Section */}
            {(formData.assessment_type === 'assignment' || formData.assessment_type === 'peer_assessment') && (
              <Paper sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">Rubrics</Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={addRubric}>
                    Add Rubric
                  </Button>
                </Box>
                {rubrics.length === 0 ? (
                  <Typography color="text.secondary">No rubrics added yet.</Typography>
                ) : (
                  rubrics.map((rubric, index) => (
                    <RubricForm
                      key={index}
                      rubric={rubric}
                      index={index}
                      onUpdate={updateRubric}
                      onDelete={deleteRubric}
                    />
                  ))
                )}
              </Paper>
            )}

            {/* Attachments Section */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Attachments
              </Typography>
              <Button variant="contained" component="label" sx={{ mb: 2 }}>
                Upload File
                <input type="file" hidden onChange={handleAttachmentChange} />
              </Button>
              {attachments.length > 0 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attachments.map((attachment, index) => (
                        <TableRow key={index}>
                          <TableCell>{attachment.name}</TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              value={attachment.description}
                              onChange={(e) => updateAttachment(index, 'description', e.target.value)}
                              placeholder="Add description"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              onClick={() => removeAttachment(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSubmit('draft')}
                disabled={createAssessmentMutation.isLoading || updateAssessmentMutation.isLoading}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleSubmit('published')}
                disabled={createAssessmentMutation.isLoading || updateAssessmentMutation.isLoading}
                >
                {editAssessmentId ? 'Update' : 'Publish'}
              </Button>
            </Box>
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: '' })}>
          <DialogTitle>Confirm {confirmDialog.action === 'published' ? (editAssessmentId ? 'Update' : 'Publish') : 'Save'}</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {confirmDialog.action === 'published' ? (editAssessmentId ? 'update' : 'publish') : 'save as draft'} this assessment?
              {confirmDialog.action === 'published' && !editAssessmentId && ' It will be available to students immediately.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, action: '' })}>Cancel</Button>
            <Button onClick={confirmSubmit} variant="contained" color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default AssessmentManager;