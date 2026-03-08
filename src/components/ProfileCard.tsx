import { motion } from "framer-motion";
import { Users, UserCheck, FileText, Calendar, MapPin } from "lucide-react";
import { XProfile } from "@/lib/nitter";

interface ProfileCardProps {
  profile: XProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const stats = [
    { label: "Tweets", value: profile.tweetCount || "0", icon: FileText },
    { label: "Followers", value: profile.followers || "0", icon: Users },
    { label: "Following", value: profile.following || "0", icon: UserCheck },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="profile-card"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="avatar-wrapper">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt={profile.name}
              width={80}
              height={80}
              className="avatar-img"
            />
          ) : (
            <div className="avatar-fallback">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="profile-name">{profile.name}</h3>
            {profile.verified && (
               <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className="w-[18px] h-[18px]"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.838 3.447-.074.346-.112.705-.112 1.07 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25C8.982 21.585 10.29 22.5 12 22.5s2.816-.917 3.337-2.25c.416.165.866.25 1.336.25 2.21 0 3.918-1.792 3.918-4 0-.365-.038-.724-.112-1.07 1.098-.702 1.838-1.988 1.838-3.448z" fill="#1d9bf0"></path><path d="M10.25 16.5l-3.5-3.5 1.5-1.5 2 2 6-6 1.5 1.5-7.5 7.5z" fill="#fff"></path></g></svg>
            )}
          </div>
          <p className="profile-username">@{profile.username}</p>
          {profile.bio && (
            <p className="profile-bio-text">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Meta info */}
      {(profile.location || profile.joinedDate) && (
        <div className="meta-row">
          {profile.location && (
            <span className="meta-item">
              <MapPin size={13} />
              {profile.location}
            </span>
          )}
          {profile.joinedDate && (
            <span className="meta-item">
              <Calendar size={13} />
              {profile.joinedDate}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
