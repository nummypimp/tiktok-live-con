class CommentFilter {
  constructor() {
    this.rules = [];
  }

  shouldFilterMessage(text) {
    if (!text || text.trim() === '') return true;
    const greetings = ['สวัสดี', 'hello', 'hi'];
    return greetings.some(greet => text.toLowerCase().includes(greet));
  }
}

module.exports = CommentFilter;