class CourseSwap:
    def __init__(self):
        self.have_courses = {}
        self.want_courses = {}

    def add_have_course(self, user_id, course_id):
        if course_id not in self.have_courses:
            self.have_courses[course_id] = set()
        self.have_courses[course_id].add(user_id)

    def add_want_course(self, user_id, course_id):
        if course_id not in self.want_courses:
            self.want_courses[course_id] = set()
        self.want_courses[course_id].add(user_id)

    def find_potential_matches(self):
        # ---------------------
        # print(self.have_courses['Course1'])
        # print(self.want_courses)
        # pass
        matches = []
        for course_id in self.have_courses:
            if course_id in self.want_courses:
                have_users = self.have_courses[course_id]
                want_users = self.want_courses[course_id]
            for have_user in have_users:
                for want_user in want_users:
                    if have_user!=want_user:
                        matches.append((have_user, want_user, course_id))
        print(matches)

# Example usage:
if __name__ == "__main__":
    course_swap = CourseSwap()

    # Adding some sample data to 'have' and 'want' courses
    course_swap.add_have_course('User1', 'Course1')
    course_swap.add_have_course('User2', 'Course2')
    course_swap.add_want_course('User3', 'Course1')
    course_swap.add_want_course('User1', 'Course2')

    # You can implement the logic to find and display potential matches
    course_swap.find_potential_matches()
