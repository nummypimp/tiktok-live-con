\napp.get('/get-rules', (req, res) => {
  res.json({ rules: commentRules });
});