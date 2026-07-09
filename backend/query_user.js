const mongoose = require('mongoose');

async function cleanUser() {
    try {
        const connStr = 'mongodb+srv://anshushee2000_db_user:Anshu2007@cluster0.ud2g4rz.mongodb.net/earthquakes?appName=Cluster0';
        await mongoose.connect(connStr);
        console.log('CONNECTED TO DB');

        const emailToDelete = 'anshushee2000@gmail.com';
        const deleteRes = await mongoose.connection.db.collection('users').deleteOne({ email: emailToDelete });

        console.log(`DELETED USER '${emailToDelete}':`, deleteRes.deletedCount);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanUser();
