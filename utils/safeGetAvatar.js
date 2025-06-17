function safeGetAvatar(data) {
  if (data && data.userDetails && Array.isArray(data.userDetails.profilePictureUrls) && data.userDetails.profilePictureUrls.length > 0) {
    return data.userDetails.profilePictureUrls[0];
  }
  return '/avatar-default.webp';
}

module.exports = safeGetAvatar;