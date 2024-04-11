function doGet() {
  return HtmlService.createHtmlOutputFromFile('index.html')
}
function create_new_assignment(course_id, title = '', description = '', maxPoints = 100, y = '', m = '', d = '', h = '', min = '', topicId = '') {

  var assignment_details = {
    title: title,
    state: "PUBLISHED",
    description: description,
    maxPoints: parseInt(maxPoints) || 0,
    /*materials: [
      {
        driveFile:{
        driveFile: {
          id: "fileID", 
          title: "Sample Document"
  
        },
        shareMode: "STUDENT_COPY"
        }
  
      }
      ],
      */
    workType: "ASSIGNMENT"
  }

  y = y||''
  m=m||''
  d=d||''
  h=h||''
  min=min||''
  if (y!='' && m!='' && d!= ''){
    assignment_details.dueDate = {
      "year": parseInt(y),
      "month": parseInt(m),
      "day": parseInt(d)
    };
    assignment_details.dueTime = {

      "hours": parseInt(h),
      "minutes": parseInt(min),
      "seconds": 0,
      "nanos": 0
    };
  }
  if (topicId != ''){
    assignment_details.topicId = topicId.toString();
  }
  console.log(assignment_details.topicId)
  console.log(assignment_details)
  let assignemn = Classroom.Courses.CourseWork.create(assignment_details, course_id);
  return assignemn;
}

function pickGoogleSheet(sheet_name) {
  var files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
  var sheetNames = [];
  var sheets = [];
  while (files.hasNext()) {
    var sheet = files.next();
    sheetNames.push(sheet.getName());
    sheets.push(sheet)
  }
  for (var i = 0; i < sheetNames.length; i++) {
    if (sheet_name == sheetNames[i]) {
      break
    }
  }
  return SpreadsheetApp.openById(sheets[i].getId())
}

function addgrades(cwid, assignment_id, sub_id, grade,
  update_dict = { 'updateMask': 'draftGrade' }) {

  var studentSubmission = Classroom.newStudentSubmission();
  var studentSubmission = {
    'draftGrade': grade,
    'assignedGrade': grade
  };

  Classroom.Courses.CourseWork.StudentSubmissions
    .patch(
      studentSubmission,
      cwid,
      assignment_id,
      sub_id,
      update_dict
    );
}

function runfirst(class_name, assignment_name) {


  const all_courses = Classroom.Courses.list({ pageSize: 100 });
  for (let course of all_courses.courses) {
    if (course.name == class_name) {
      course_id = course.id;
      break;
    }
  }

  if (!assignment_name || assignment_name == '') {
    return [course_id, null, null]
  }

  let cws = Classroom.Courses.CourseWork.list(course_id).courseWork

  for (let cw of cws) {
    if (cw.title == assignment_name) {
      assignment_id = cw.id;
      assignment = cw
      break
    }
  }

  return [course_id, assignment, assignment_id]

}


// Classroom.Courses.CourseWork.create(courseId)
function createCoursework(id) {
  Classroom.Courses.CourseWork.create(id,
    { // doesn't work but triggers permissions correctly
      "courseId": id,
      "title": 'foo',
      "description": 'desc',
    });
}


function main(course_id, sheet_name, assignment_id) {
  if (!course_id) {
    return
  }
  grade_sheet = pickGoogleSheet(sheet_name);
  // console.log(grade_sheet.getSheets())
  emails = grade_sheet.getRange('A2:A').getValues();
  grades = grade_sheet.getRange('B2:B').getValues();
  let ggrades = [];
  let eemails = [];
  for (let i = 0; i < emails.length; i++) {
    if (emails[i][0] != '') {
      eemails.push(emails[i][0]);
      ggrades.push(grades[i][0]);
    };
  };

  for (var i = 0; i < eemails.length; i++) {
    em = eemails[i]
    gg = ggrades[i]

    let student;
    try {
      student = Classroom.Courses.Students.get(course_id, em);
    } catch (e) {
    }
    if (student) {
      var submission = Classroom.Courses.CourseWork.StudentSubmissions
        .list(course_id, assignment_id)
        .studentSubmissions
        .find(obj => { return obj.userId == student.userId });
      addgrades(course_id, assignment_id, submission.id, gg)
    }

  };
}

function get_topic_id(course_id,topic_name){
  if (topic_name!=''){
  return Classroom.Courses.Topics.list(course_id).topic.find(obj=>{ return obj.name == topic_name }).topicId
  } else{
    return ''
  }

}


