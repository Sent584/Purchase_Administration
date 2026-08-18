"""HR seed employee/designation data constants for Sasurie Engineering College."""

from __future__ import annotations

DESIGNATIONS: list[dict] = [
    {"code": "PROF", "name": "Professor", "category": "teaching", "grade": "AGP-10000", "pay_level": "14", "retirement_age": 65},
    {"code": "ASSO-PROF", "name": "Associate Professor", "category": "teaching", "grade": "AGP-9000", "pay_level": "13A", "retirement_age": 65},
    {"code": "ASST-PROF", "name": "Assistant Professor", "category": "teaching", "grade": "AGP-6000", "pay_level": "10", "retirement_age": 65},
    {"code": "LECT", "name": "Lecturer", "category": "teaching", "grade": "AGP-5400", "pay_level": "9", "retirement_age": 60},
    {"code": "HOD", "name": "Head of Department", "category": "teaching", "grade": "AGP-10000", "pay_level": "14", "retirement_age": 65},
    {"code": "LAB-TECH", "name": "Laboratory Technician", "category": "non_teaching", "grade": "Level-5", "pay_level": "5", "retirement_age": 58},
    {"code": "ADMIN-OFF", "name": "Administrative Officer", "category": "non_teaching", "grade": "Level-7", "pay_level": "7", "retirement_age": 58},
    {"code": "ACCT", "name": "Accountant", "category": "non_teaching", "grade": "Level-6", "pay_level": "6", "retirement_age": 58},
    {"code": "LIB-ASST", "name": "Library Assistant", "category": "non_teaching", "grade": "Level-4", "pay_level": "4", "retirement_age": 58},
    {"code": "OA", "name": "Office Assistant", "category": "non_teaching", "grade": "Level-2", "pay_level": "2", "retirement_age": 58},
]

# Realistic Tamil Nadu faculty & staff names for SAE Coimbatore
EMPLOYEES: list[dict] = [
    {"email": "n.anbarasan@sasurie.edu.in", "title": "Dr.", "first": "N.", "last": "Anbarasan", "cat": "teaching", "type": "permanent", "desig": "HOD", "dept": "SAE-CBE-CSE", "rank": "professor", "phd": "phd_awarded", "spec": "Machine Learning", "gender": "Male"},
    {"email": "s.priyadarshini@sasurie.edu.in", "title": "Dr.", "first": "S.", "last": "Priyadarshini", "cat": "teaching", "type": "permanent", "desig": "ASSO-PROF", "dept": "SAE-CBE-CSE", "rank": "associate_professor", "phd": "phd_awarded", "spec": "Computer Networks", "gender": "Female"},
    {"email": "k.aravind@sasurie.edu.in", "title": "Mr.", "first": "K.", "last": "Aravind", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-CSE", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Data Structures", "gender": "Male"},
    {"email": "r.meena@sasurie.edu.in", "title": "Ms.", "first": "R.", "last": "Meena", "cat": "teaching", "type": "probation", "desig": "ASST-PROF", "dept": "SAE-CBE-CSE", "rank": "assistant_professor", "phd": "not_applicable", "spec": "Web Technologies", "gender": "Female"},
    {"email": "v.suresh@sasurie.edu.in", "title": "Mr.", "first": "V.", "last": "Suresh", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-CSE", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Cyber Security", "gender": "Male"},
    {"email": "p.lakshmi@sasurie.edu.in", "title": "Dr.", "first": "P.", "last": "Lakshmi", "cat": "teaching", "type": "permanent", "desig": "ASSO-PROF", "dept": "SAE-CBE-ECE", "rank": "associate_professor", "phd": "phd_awarded", "spec": "VLSI Design", "gender": "Female"},
    {"email": "m.balaji@sasurie.edu.in", "title": "Mr.", "first": "M.", "last": "Balaji", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-ECE", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Embedded Systems", "gender": "Male"},
    {"email": "a.kavitha@sasurie.edu.in", "title": "Ms.", "first": "A.", "last": "Kavitha", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-ECE", "rank": "assistant_professor", "phd": "not_applicable", "spec": "Digital Signal Processing", "gender": "Female"},
    {"email": "g.murugan@sasurie.edu.in", "title": "Dr.", "first": "G.", "last": "Murugan", "cat": "teaching", "type": "permanent", "desig": "HOD", "dept": "SAE-CBE-EEE", "rank": "professor", "phd": "phd_awarded", "spec": "Power Systems", "gender": "Male"},
    {"email": "t.divya@sasurie.edu.in", "title": "Ms.", "first": "T.", "last": "Divya", "cat": "teaching", "type": "contract", "desig": "LECT", "dept": "SAE-CBE-EEE", "rank": "lecturer", "phd": "not_applicable", "spec": "Electrical Machines", "gender": "Female"},
    {"email": "s.karthikeyan@sasurie.edu.in", "title": "Mr.", "first": "S.", "last": "Karthikeyan", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-EEE", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Renewable Energy", "gender": "Male"},
    {"email": "r.senthil@sasurie.edu.in", "title": "Dr.", "first": "R.", "last": "Senthil", "cat": "teaching", "type": "permanent", "desig": "HOD", "dept": "SAE-CBE-MECH", "rank": "professor", "phd": "phd_awarded", "spec": "Thermal Engineering", "gender": "Male"},
    {"email": "n.geetha@sasurie.edu.in", "title": "Ms.", "first": "N.", "last": "Geetha", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-MECH", "rank": "assistant_professor", "phd": "not_applicable", "spec": "Manufacturing", "gender": "Female"},
    {"email": "b.pradeep@sasurie.edu.in", "title": "Mr.", "first": "B.", "last": "Pradeep", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-MECH", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "CAD/CAM", "gender": "Male"},
    {"email": "k.vanitha@sasurie.edu.in", "title": "Dr.", "first": "K.", "last": "Vanitha", "cat": "teaching", "type": "permanent", "desig": "ASSO-PROF", "dept": "SAE-CBE-CIVIL", "rank": "associate_professor", "phd": "phd_awarded", "spec": "Structural Engineering", "gender": "Female"},
    {"email": "j.mahesh@sasurie.edu.in", "title": "Mr.", "first": "J.", "last": "Mahesh", "cat": "teaching", "type": "probation", "desig": "ASST-PROF", "dept": "SAE-CBE-CIVIL", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Geotechnical Engineering", "gender": "Male"},
    {"email": "c.anitha@sasurie.edu.in", "title": "Ms.", "first": "C.", "last": "Anitha", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-IT", "rank": "assistant_professor", "phd": "not_applicable", "spec": "Cloud Computing", "gender": "Female"},
    {"email": "d.rajesh@sasurie.edu.in", "title": "Mr.", "first": "D.", "last": "Rajesh", "cat": "teaching", "type": "permanent", "desig": "ASST-PROF", "dept": "SAE-CBE-IT", "rank": "assistant_professor", "phd": "phd_pursuing", "spec": "Mobile Computing", "gender": "Male"},
    {"email": "s.uma@sasurie.edu.in", "title": "Dr.", "first": "S.", "last": "Uma", "cat": "teaching", "type": "visiting", "desig": "PROF", "dept": "SAE-CBE-CSE", "rank": "professor", "phd": "phd_awarded", "spec": "Artificial Intelligence", "gender": "Female"},
    {"email": "h.natarajan@sasurie.edu.in", "title": "Mr.", "first": "H.", "last": "Natarajan", "cat": "teaching", "type": "adjunct", "desig": "ASSO-PROF", "dept": "SAE-CBE-ECE", "rank": "associate_professor", "phd": "phd_awarded", "spec": "Communication Systems", "gender": "Male"},
]
